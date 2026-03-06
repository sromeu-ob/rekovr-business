import { MongoClient } from 'mongodb';
import { E2E_PREFIX, MONGODB_URI, MONGODB_DB } from './constants';

/**
 * Delete all test-created data from MongoDB.
 * Uses the [E2E] prefix and specific item IDs to identify test data.
 */
export async function cleanupTestData(itemIds: string[] = []): Promise<void> {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(MONGODB_DB);

    // 1. Find all E2E items (by prefix in title)
    const e2eItems = await db
      .collection('items')
      .find({ title: { $regex: `^\\${E2E_PREFIX.replace('[', '\\[')}` } })
      .project({ item_id: 1 })
      .toArray();

    const allItemIds = [
      ...new Set([...itemIds, ...e2eItems.map((i) => i.item_id)]),
    ];

    console.log(`  Cleanup: found ${allItemIds.length} E2E items to clean`);

    if (allItemIds.length > 0) {
      // 2. Delete matches involving these items
      const matchResult = await db.collection('matches').deleteMany({
        $or: [
          { lost_item_id: { $in: allItemIds } },
          { found_item_id: { $in: allItemIds } },
        ],
      });
      console.log(`  Cleanup: deleted ${matchResult.deletedCount} matches`);

      // 3. Delete notifications for these items
      const notifResult = await db.collection('notifications').deleteMany({
        $or: [
          { 'data.item_id': { $in: allItemIds } },
          { 'data.match_id': { $exists: true } },
        ],
      });
      console.log(`  Cleanup: deleted ${notifResult.deletedCount} notifications`);

      // 4. Delete match queue entries
      const queueResult = await db.collection('match_queue').deleteMany({
        item_id: { $in: allItemIds },
      });
      console.log(`  Cleanup: deleted ${queueResult.deletedCount} match_queue entries`);
    }

    // 5. Delete the items themselves
    const itemResult = await db.collection('items').deleteMany({
      title: { $regex: `^\\${E2E_PREFIX.replace('[', '\\[')}` },
    });
    console.log(`  Cleanup: deleted ${itemResult.deletedCount} items`);
  } finally {
    await client.close();
  }
}

/**
 * Ensure the test B2B org and users exist in the database.
 * Creates them if they don't exist (idempotent).
 */
export async function ensureTestInfrastructure(config: {
  adminEmail: string;
  adminPassword: string;
  bizAdminEmail: string;
  bizAdminPassword: string;
  c2cEmail?: string;
  c2cPassword?: string;
  orgName: string;
}): Promise<{ orgId: string; adminUserId: string; bizAdminUserId: string }> {
  const client = new MongoClient(MONGODB_URI);
  const bcryptHash =
    '$2b$12$cBN3WWHugMjHS4FHfZgcq.VfSj2oZt9xLBFF8SL3IRum3Ll7dhX3a'; // Playwright2026!

  try {
    await client.connect();
    const db = client.db(MONGODB_DB);

    // 1. Ensure platform admin user exists
    let adminUser = await db
      .collection('users')
      .findOne({ email: config.adminEmail });
    if (!adminUser) {
      const adminUserId = `user_e2e_admin_${Date.now()}`;
      await db.collection('users').insertOne({
        user_id: adminUserId,
        email: config.adminEmail,
        name: 'E2E Platform Admin',
        password: bcryptHash,
        auth_provider: 'email',
        role: 'admin',
        language: 'en',
        email_verified: true,
        rating_avg: 0,
        rating_count: 0,
        items_lost: 0,
        items_found: 0,
        items_recovered: 0,
        wallet_balance: 0,
        created_at: new Date().toISOString(),
      });
      adminUser = { user_id: adminUserId };
      console.log(`  Created platform admin: ${config.adminEmail}`);
    } else {
      // Ensure admin role is set
      await db
        .collection('users')
        .updateOne({ email: config.adminEmail }, { $set: { role: 'admin' } });
    }

    // 2. Ensure B2B admin user exists
    let bizUser = await db
      .collection('users')
      .findOne({ email: config.bizAdminEmail });
    if (!bizUser) {
      const bizUserId = `user_e2e_bizadmin_${Date.now()}`;
      await db.collection('users').insertOne({
        user_id: bizUserId,
        email: config.bizAdminEmail,
        name: 'E2E Business Admin',
        password: bcryptHash,
        auth_provider: 'email',
        role: 'user',
        language: 'en',
        email_verified: true,
        rating_avg: 0,
        rating_count: 0,
        items_lost: 0,
        items_found: 0,
        items_recovered: 0,
        wallet_balance: 0,
        created_at: new Date().toISOString(),
      });
      bizUser = { user_id: bizUserId };
      console.log(`  Created B2B admin user: ${config.bizAdminEmail}`);
    }

    // 3. Ensure C2C user exists (for creating lost items)
    if (config.c2cEmail) {
      let c2cUser = await db
        .collection('users')
        .findOne({ email: config.c2cEmail });
      if (!c2cUser) {
        const c2cUserId = `user_e2e_c2c_${Date.now()}`;
        await db.collection('users').insertOne({
          user_id: c2cUserId,
          email: config.c2cEmail,
          name: 'E2E Lost Item User',
          password: bcryptHash,
          auth_provider: 'email',
          role: 'user',
          language: 'en',
          email_verified: true,
          rating_avg: 0,
          rating_count: 0,
          items_lost: 0,
          items_found: 0,
          items_recovered: 0,
          wallet_balance: 0,
          created_at: new Date().toISOString(),
        });
        console.log(`  Created C2C user: ${config.c2cEmail}`);
      }
    }

    // 4. Ensure test organization exists
    let org = await db
      .collection('organizations')
      .findOne({ name: config.orgName });
    if (!org) {
      const orgId = `org_e2e_${Date.now()}`;
      await db.collection('organizations').insertOne({
        organization_id: orgId,
        name: config.orgName,
        type: 'airport',
        slug: 'e2e-test-airport',
        subscription_plan: 'pro',
        subscription_status: 'active',
        default_location: {
          type: 'Point',
          coordinates: [2.1734, 41.3851],
          address: 'Barcelona Airport',
        },
        operator_visibility: 'shared',
        members: [
          {
            user_id: bizUser.user_id,
            role: 'admin',
            added_at: new Date().toISOString(),
          },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      org = { organization_id: orgId };
      console.log(`  Created org: ${config.orgName} (${orgId})`);
    } else {
      // Ensure bizUser is a member
      const isMember = org.members?.some(
        (m: any) => m.user_id === bizUser!.user_id,
      );
      if (!isMember) {
        await db.collection('organizations').updateOne(
          { organization_id: org.organization_id },
          {
            $push: {
              members: {
                user_id: bizUser.user_id,
                role: 'admin',
                added_at: new Date().toISOString(),
              },
            } as any,
          },
        );
        console.log(`  Added ${config.bizAdminEmail} to org ${org.organization_id}`);
      }
    }

    return {
      orgId: org.organization_id,
      adminUserId: adminUser.user_id,
      bizAdminUserId: bizUser.user_id,
    };
  } finally {
    await client.close();
  }
}
