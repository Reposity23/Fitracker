import { jsPDF } from 'jspdf';
import { useEffect, useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { createProgress, fetchProgress } from './api';
import type { ProgressItem } from './types';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

const initialForm: ProgressItem = {
  date: new Date().toISOString().slice(0, 10),
  food: '',
  exercise: '',
  wheyGrams: 0,
  creatineGrams: 0,
};

function formatDateLabel(input: string): string {
  const date = new Date(`${input}T00:00:00`);
  return date.toLocaleDateString('en-US');
}

function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function App() {
  const [entries, setEntries] = useState<ProgressItem[]>([]);
  const [form, setForm] = useState<ProgressItem>(initialForm);
  const [selectedDate, setSelectedDate] = useState<string>(initialForm.date);
  const [imagePreview, setImagePreview] = useState<string | undefined>();
  const [status, setStatus] = useState<string>('Loading your logs...');

  useEffect(() => {
    fetchProgress()
      .then((records) => {
        setEntries(records);
        setStatus(records.length ? 'Ready' : 'No entries yet. Add your first day.');
      })
      .catch(() => setStatus('Could not reach backend. Check MongoDB / Netlify settings.'));
  }, []);

  const selectedDayEntries = useMemo(
    () => entries.filter((entry) => entry.date === selectedDate),
    [entries, selectedDate],
  );

  const chartData = useMemo(() => {
    const grouped = new Map<string, { day: string; foodLogs: number; exerciseLogs: number }>();
    entries.forEach((entry) => {
      if (!grouped.has(entry.date)) {
        grouped.set(entry.date, {
          day: formatDateLabel(entry.date),
          foodLogs: 0,
          exerciseLogs: 0,
        });
      }
      const current = grouped.get(entry.date)!;
      if (entry.food.trim()) current.foodLogs += 1;
      if (entry.exercise.trim()) current.exerciseLogs += 1;
    });

    return [...grouped.values()].slice(-14);
  }, [entries]);

  async function handleImageUpload(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : undefined;
      setImagePreview(result);
      setForm((prev) => ({ ...prev, imageData: result, imageName: file.name }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const saved = await createProgress(form);
      setEntries((prev) => [saved, ...prev]);
      setStatus(`Saved progress for ${formatDateLabel(saved.date)}.`);
      setForm({ ...initialForm, date: form.date });
      setImagePreview(undefined);
      setSelectedDate(saved.date);
    } catch {
      setStatus('Failed to save progress.');
    }
  }

  function exportPdf() {
    if (!entries.length) {
      setStatus('Nothing to export yet.');
      return;
    }

    const doc = new jsPDF();
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

    let y = 20;
    sorted.forEach((entry, index) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(12);
      doc.text(`DATE: ${formatDateLabel(entry.date)}`, 12, y);
      y += 8;
      doc.text(`DAY ${index + 1}`, 12, y);
      y += 8;
      doc.text(`FOOD: ${entry.food || '-'}`, 12, y);
      y += 8;
      doc.text(`EXERCISE: ${entry.exercise || '-'}`, 12, y);
      y += 8;
      doc.text(`WHEY GRAMS: ${entry.wheyGrams ?? 0}`, 12, y);
      y += 8;
      doc.text(`CREATINE GRAMS: ${entry.creatineGrams ?? 0}`, 12, y);
      y += 12;
      doc.text('---', 12, y);
      y += 10;
    });

    doc.save(`fitracker-progress-${sorted[sorted.length - 1].date}.pdf`);
  }

  return (
    <main className="page">
      <section className="card entry-card">
        <h1>Fitracker Progress Hub</h1>
        <p className="hint">Track food, workouts, supplements, and image updates each day.</p>

        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            Date / Time
            <input
              type="datetime-local"
              value={`${form.date}T08:00`}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, date: event.target.value.slice(0, 10) }))
              }
            />
          </label>

          <label>
            Food
            <textarea
              placeholder="e.g. chicken + rice"
              value={form.food}
              onChange={(event) => setForm((prev) => ({ ...prev, food: event.target.value }))}
            />
          </label>

          <label>
            Exercise
            <textarea
              placeholder="e.g. push day + 30m cardio"
              value={form.exercise}
              onChange={(event) => setForm((prev) => ({ ...prev, exercise: event.target.value }))}
            />
          </label>

          <div className="inline-fields">
            <label>
              Whey grams
              <input
                type="number"
                min={0}
                value={form.wheyGrams}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, wheyGrams: Number(event.target.value) }))
                }
              />
            </label>
            <label>
              Creatine grams
              <input
                type="number"
                min={0}
                value={form.creatineGrams}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, creatineGrams: Number(event.target.value) }))
                }
              />
            </label>
          </div>

          <label>
            Progress image
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
            />
          </label>

          {imagePreview && <img className="preview" src={imagePreview} alt="Progress preview" />}

          <button className="primary" type="submit">
            Upload Progress
          </button>
        </form>

        <p className="status">{status}</p>
      </section>

      <section className="card">
        <h2>Calendar View</h2>
        <Calendar
          onChange={(value: Value) => {
            const date = Array.isArray(value) ? value[0] : value;
            if (date) setSelectedDate(toDateInput(date));
          }}
          value={new Date(`${selectedDate}T00:00:00`)}
        />

        <div className="day-log">
          <h3>{formatDateLabel(selectedDate)}</h3>
          {selectedDayEntries.length === 0 ? (
            <p>No logs for this day yet.</p>
          ) : (
            selectedDayEntries.map((entry) => (
              <article key={entry._id ?? `${entry.date}-${entry.createdAt}`} className="log-card">
                <p>
                  <strong>Food:</strong> {entry.food}
                </p>
                <p>
                  <strong>Exercise:</strong> {entry.exercise}
                </p>
                <p>
                  <strong>Whey:</strong> {entry.wheyGrams}g | <strong>Creatine:</strong>{' '}
                  {entry.creatineGrams}g
                </p>
                {entry.imageData && <img src={entry.imageData} alt={entry.imageName ?? 'Progress'} />}
              </article>
            ))
          )}
        </div>
      </section>

      <section className="card">
        <h2>Food / Exercise Diagram</h2>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="foodLogs" fill="#ff8a65" name="Food entries" />
              <Bar dataKey="exerciseLogs" fill="#42a5f5" name="Exercise entries" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <button className="secondary" onClick={exportPdf}>
          Export Progress to PDF
        </button>
      </section>
    </main>
  );
}
