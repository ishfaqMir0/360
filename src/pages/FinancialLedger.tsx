import { useState, useMemo } from 'react';
import { Plus, Droplets, ChevronDown, ChevronUp } from 'lucide-react';

/* ---------------- MASTER DATA ---------------- */

const SPRAY_STAGES = [
  'Dormant',
  'Green Tip',
  'Pink Bud',
  'Petal Fall',
  'Fruit Set',
  'Cover Spray 1',
  'Cover Spray 2',
  'Cover Spray 3',
];

const CHEMICAL_LIBRARY = [
  { name: 'Mancozeb', unit: 'kg', recommended: '2–2.5 g/L' },
  { name: 'Imidacloprid', unit: 'ml', recommended: '0.3 ml/L' },
  { name: 'HM Oil', unit: 'l', recommended: '1.5–2%' },
  { name: 'Carbendazim', unit: 'kg', recommended: '1 g/L' },
  { name: 'Chlorpyrifos', unit: 'ml', recommended: '2 ml/L' },
];

/* ---------------- TYPES ---------------- */

type Chemical = {
  name: string;
  qty: number;
  unit: string;
  rate: number;
  recommended: string;
};

type Spray = {
  id: string;
  sprayNo: number;
  stage: string;
  date: string;
  water: number;
  chemicals: Chemical[];
  labourCount: number;
  labourRate: number;
};

/* ---------------- COMPONENT ---------------- */

export default function FinancialLedger() {
  const [sprays, setSprays] = useState<Spray[]>([]);
  const [stage, setStage] = useState('');
  const [date, setDate] = useState('');
  const [water, setWater] = useState('');
  const [chemicals, setChemicals] = useState<Chemical[]>([]);
  const [labours, setLabours] = useState('');
  const [labourRate, setLabourRate] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  /* ---------------- LOGIC ---------------- */

  const chemicalCost = (c: Chemical) => c.qty * c.rate;

  const sprayCost = (s: Spray) =>
    s.chemicals.reduce((sum, c) => sum + chemicalCost(c), 0) +
    s.labourCount * s.labourRate;

  const totalSprayCost = useMemo(
    () => sprays.reduce((s, sp) => s + sprayCost(sp), 0),
    [sprays]
  );

  /* ---------------- ACTIONS ---------------- */

  const addChemical = () => {
    setChemicals([
      ...chemicals,
      { name: '', qty: 0, unit: '', rate: 0, recommended: '' },
    ]);
  };

  const updateChemical = (i: number, key: keyof Chemical, value: any) => {
    const copy = [...chemicals];
    copy[i][key] = value;
    setChemicals(copy);
  };

  const selectChemical = (i: number, name: string) => {
    const chem = CHEMICAL_LIBRARY.find(c => c.name === name);
    if (!chem) return;
    updateChemical(i, 'name', chem.name);
    updateChemical(i, 'unit', chem.unit);
    updateChemical(i, 'recommended', chem.recommended);
  };

  const saveSpray = () => {
    if (!stage || !date || chemicals.length === 0) return;

    setSprays([
      ...sprays,
      {
        id: crypto.randomUUID(),
        sprayNo: sprays.length + 1,
        stage,
        date,
        water: Number(water),
        chemicals,
        labourCount: Number(labours || 0),
        labourRate: Number(labourRate || 0),
      },
    ]);

    setStage('');
    setDate('');
    setWater('');
    setChemicals([]);
    setLabours('');
    setLabourRate('');
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Financial Ledger – Spray Register</h1>

      {/* ================= ADD SPRAY ================= */}
      <div className="border rounded-lg p-6 space-y-4">
        <h2 className="font-semibold flex gap-2 items-center">
          <Droplets /> Add Spray Operation
        </h2>

        <div className="grid grid-cols-4 gap-4">
          <select className="border p-2 rounded" value={stage} onChange={e => setStage(e.target.value)}>
            <option value="">Select Stage</option>
            {SPRAY_STAGES.map(s => <option key={s}>{s}</option>)}
          </select>
          <input type="date" className="border p-2 rounded" value={date} onChange={e => setDate(e.target.value)} />
          <input placeholder="Water (Litres)" className="border p-2 rounded" value={water} onChange={e => setWater(e.target.value)} />
        </div>

        {/* Chemicals */}
        <div className="space-y-2">
          {chemicals.map((c, i) => (
            <div key={i} className="grid grid-cols-5 gap-2">
              <select className="border p-2 rounded" onChange={e => selectChemical(i, e.target.value)}>
                <option value="">Select Chemical</option>
                {CHEMICAL_LIBRARY.map(c => <option key={c.name}>{c.name}</option>)}
                <option value="custom">Other (Manual)</option>
              </select>
              <input placeholder="Qty" type="number" className="border p-2 rounded" onChange={e => updateChemical(i, 'qty', +e.target.value)} />
              <input placeholder="Unit" className="border p-2 rounded" value={c.unit} />
              <input placeholder="Rate" type="number" className="border p-2 rounded" onChange={e => updateChemical(i, 'rate', +e.target.value)} />
              <div className="text-xs text-gray-500 self-center">
                {c.recommended && `Rec: ${c.recommended}`}
              </div>
            </div>
          ))}
        </div>

        <button onClick={addChemical} className="border px-3 py-2 rounded">
          <Plus size={14} /> Add Chemical
        </button>

        {/* Labour */}
        <div className="grid grid-cols-3 gap-4">
          <input placeholder="Labours Used" className="border p-2 rounded" value={labours} onChange={e => setLabours(e.target.value)} />
          <input placeholder="Rate / Labour" className="border p-2 rounded" value={labourRate} onChange={e => setLabourRate(e.target.value)} />
        </div>

        <button onClick={saveSpray} className="bg-green-600 text-white px-6 py-2 rounded">
          Save Spray
        </button>

        <p className="font-semibold">Total Spray Expense: ₹{totalSprayCost}</p>
      </div>

      {/* ================= SPRAY HISTORY ================= */}
      {sprays.map(sp => (
        <div key={sp.id} className="border rounded p-4">
          <div className="flex justify-between cursor-pointer" onClick={() => setOpen(open === sp.id ? null : sp.id)}>
            <div>
              <p className="font-semibold">
                Spray #{sp.sprayNo} – {sp.stage}
              </p>
              <p className="text-sm text-gray-500">
                {sp.date} • {sp.chemicals.length > 1 ? `Mixed Spray: ${sp.chemicals.map(c => c.name).join(' + ')}` : sp.chemicals[0].name}
              </p>
            </div>
            {open === sp.id ? <ChevronUp /> : <ChevronDown />}
          </div>

          {open === sp.id && (
            <div className="mt-3 space-y-1 text-sm">
              {sp.chemicals.map((c, i) => (
                <div key={i} className="flex justify-between">
                  <span>{c.name} – {c.qty}{c.unit}</span>
                  <span>₹{chemicalCost(c)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2">
                <span>Labour Cost</span>
                <span>₹{sp.labourCount * sp.labourRate}</span>
              </div>
              <div className="flex justify-between font-bold pt-2">
                <span>Total Spray Cost</span>
                <span>₹{sprayCost(sp)}</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
