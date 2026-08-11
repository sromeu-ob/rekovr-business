import { useState } from 'react';
import {
  Plus, Save, Trash2, Edit, CheckCircle2, Package,
  Inbox, Search, Settings,
} from 'lucide-react';
import {
  Alert, Badge, Button, Card, EmptyState, Input, Label, Modal,
  PageHeader, Select, Spinner, Tabs, Textarea,
} from '../components/ui';

function Section({ title, description, children }) {
  return (
    <section className="mb-10">
      <div className="mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        )}
      </div>
      <Card padding="md">
        <div className="flex flex-wrap items-start gap-4">
          {children}
        </div>
      </Card>
    </section>
  );
}

export default function DesignSystemPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [destructiveOpen, setDestructiveOpen] = useState(false);
  const [tab, setTab] = useState('all');
  const [select, setSelect] = useState('option-1');

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Design System"
        subtitle="Playground de tots els components del kit ui/ — útil per validar el disseny a cada app."
        actions={
          <>
            <Button variant="secondary" leftIcon={Settings}>Settings</Button>
            <Button variant="accent" leftIcon={Plus}>Primary action</Button>
          </>
        }
      />

      <Section title="Buttons" description="Variants, mides i estats (loading / disabled).">
        <Button variant="accent" leftIcon={Plus}>Accent (btn-brand)</Button>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive" leftIcon={Trash2}>Destructive</Button>
        <Button variant="confirm" leftIcon={CheckCircle2}>Confirm</Button>

        <div className="w-full h-px bg-slate-100 my-2" />

        <Button size="sm" variant="secondary">Small</Button>
        <Button size="md" variant="secondary">Medium</Button>
        <Button size="lg" variant="secondary">Large</Button>

        <div className="w-full h-px bg-slate-100 my-2" />

        <Button variant="accent" loading>Loading</Button>
        <Button variant="primary" disabled>Disabled</Button>
        <Button variant="secondary" leftIcon={Save} rightIcon={Edit}>Icons L+R</Button>
      </Section>

      <Section title="Badges" description="Estat, informació, comptadors inline.">
        <Badge>Neutral</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="danger">Danger</Badge>
        <Badge variant="info">Info</Badge>
        <Badge variant="muted">Muted</Badge>
        <Badge variant="success" icon={CheckCircle2} size="md">Recovered</Badge>
      </Section>

      <Section title="Form inputs" description="Alçada h-10, bg slate-50 → white en focus.">
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="ds-name" required>Nom complet</Label>
            <Input id="ds-name" placeholder="Anna Puig" />
          </div>
          <div>
            <Label htmlFor="ds-dni">DNI / NIE</Label>
            <Input id="ds-dni" placeholder="12345678A" />
          </div>
          <div>
            <Label htmlFor="ds-email">Email (error state)</Label>
            <Input id="ds-email" error placeholder="invalid@" value="invalid@" onChange={()=>{}} />
            <p className="text-xs text-red-600 mt-1.5">Email no vàlid</p>
          </div>
          <div>
            <Label htmlFor="ds-cat">Categoria</Label>
            <Select id="ds-cat" value={select} onChange={e => setSelect(e.target.value)}>
              <option value="option-1">Documentació</option>
              <option value="option-2">Roba</option>
              <option value="option-3">Electrònica</option>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="ds-desc" variant="sentence">Descripció (label sentence-case)</Label>
            <Textarea id="ds-desc" placeholder="Descriu l'objecte..." />
          </div>
        </div>
      </Section>

      <Section title="Alerts">
        <div className="w-full space-y-3">
          <Alert variant="error" title="No s'ha pogut desar">
            Revisa els camps marcats i torna-ho a intentar.
          </Alert>
          <Alert variant="warning" title="Atenció">
            Aquest pickup expira en 24h.
          </Alert>
          <Alert variant="success" title="Canvis desats">
            La configuració s'ha actualitzat correctament.
          </Alert>
          <Alert variant="info">
            Aquesta organització està en mode trial fins al 30 de juny.
          </Alert>
        </div>
      </Section>

      <Section title="Tabs" description="Segmented control estil Linear.">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { key: 'all',       label: 'All',       count: 42 },
            { key: 'active',    label: 'Active',    count: 12 },
            { key: 'recovered', label: 'Recovered', count: 30 },
          ]}
        />
      </Section>

      <Section title="Empty state">
        <div className="w-full">
          <EmptyState
            icon={Inbox}
            title="Cap resultat"
            description="No hi ha items que coincideixin amb els filtres actuals."
            action={<Button variant="accent" leftIcon={Plus}>New item</Button>}
          />
        </div>
      </Section>

      <Section title="Spinner">
        <Spinner size="sm" />
        <Spinner size="md" />
        <Spinner size="lg" />
      </Section>

      <Section title="Cards">
        <Card className="w-64">
          <p className="text-sm font-medium text-slate-900">Card default</p>
          <p className="text-sm text-slate-500 mt-1">padding md (p-6), sense shadow.</p>
        </Card>
        <Card padding="lg" shadow className="w-64">
          <p className="text-sm font-medium text-slate-900">Card lg + shadow</p>
          <p className="text-sm text-slate-500 mt-1">padding p-8 i shadow-sm.</p>
        </Card>
        <Card padding="sm" className="w-64">
          <p className="text-sm font-medium text-slate-900">Card small</p>
          <p className="text-sm text-slate-500 mt-1">padding p-4.</p>
        </Card>
      </Section>

      <Section title="Modal">
        <Button variant="primary" onClick={() => setModalOpen(true)}>Open modal</Button>
        <Button variant="destructive" leftIcon={Trash2} onClick={() => setDestructiveOpen(true)}>
          Confirm delete
        </Button>
      </Section>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Exemple de modal"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="accent" onClick={() => setModalOpen(false)}>Save</Button>
          </>
        }
      >
        <p className="text-sm text-slate-700">
          Aquest és el cos del modal. Clica fora, ESC, o el botó de tancar per sortir.
        </p>
        <div className="mt-4">
          <Label htmlFor="modal-name">Nom</Label>
          <Input id="modal-name" placeholder="Escriu el teu nom" />
        </div>
      </Modal>

      <Modal
        open={destructiveOpen}
        onClose={() => setDestructiveOpen(false)}
        title="Eliminar element"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDestructiveOpen(false)}>Cancel</Button>
            <Button variant="destructive" leftIcon={Trash2} onClick={() => setDestructiveOpen(false)}>
              Eliminar
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-700">
          Aquesta acció és irreversible. L'element i totes les seves dades associades seran eliminats.
        </p>
      </Modal>
    </div>
  );
}
