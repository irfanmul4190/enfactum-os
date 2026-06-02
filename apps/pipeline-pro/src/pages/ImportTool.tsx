import { useState, useMemo, useCallback, useRef } from 'react';
import { useEmployee } from '@/contexts/EmployeeContext';
import { mockAccounts, mockOpportunities } from '@/data/mockData';
import { STAGES_ORDERED, Stage } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Shield, Upload, FileSpreadsheet, ArrowRight, ArrowLeft, Check, AlertTriangle, X, ChevronDown, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
// xlsx loaded dynamically to avoid bundling issues

type Step = 'upload' | 'mapping' | 'review' | 'done';

// Fields that can be mapped from the spreadsheet
const MAPPABLE_FIELDS = [
  { key: 'opportunity_title', label: 'Opportunity Title', required: true },
  { key: 'account_name', label: 'Account Name', required: true },
  { key: 'country', label: 'Country', required: true },
  { key: 'workstream', label: 'Workstream', required: false },
  { key: 'stage', label: 'Stage', required: false },
  { key: 'est_value_sgd', label: 'Est. Value (SGD)', required: false },
  { key: 'source', label: 'Source', required: false },
  { key: 'primary_contact_free_text', label: 'Primary Contact', required: false },
  { key: 'notes', label: 'Notes', required: false },
  { key: 'tags', label: 'Tags (comma-separated)', required: false },
  { key: 'expected_close_month', label: 'Expected Close Month', required: false },
] as const;

type MappableKey = typeof MAPPABLE_FIELDS[number]['key'];

interface ParsedRow {
  [key: string]: string;
}

interface MappedRow {
  opportunity_title: string;
  account_name: string;
  country: string;
  workstream?: string;
  stage?: string;
  est_value_sgd?: number;
  source?: string;
  primary_contact_free_text?: string;
  notes?: string;
  tags?: string[];
  expected_close_month?: string;
  // Dedup
  _accountMatch?: { id: string; name: string } | null;
  _oppDuplicate?: { id: string; title: string } | null;
  _isNewAccount: boolean;
  _rowIndex: number;
  _selected: boolean;
  _hasError: boolean;
  _errors: string[];
}

export default function ImportTool() {
  const { appRole } = useEmployee();
  const [step, setStep] = useState<Step>('upload');
  const [rawData, setRawData] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<MappableKey, string>>({} as any);
  const [mappedRows, setMappedRows] = useState<MappedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [importedCount, setImportedCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  if (appRole !== 'admin') {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <Shield className="h-10 w-10 text-muted-foreground mx-auto" />
          <h2 className="text-lg font-semibold">Access Restricted</h2>
          <p className="text-sm text-muted-foreground">Admin privileges required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold">Import Opportunities</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Upload an Excel or CSV file to bulk-import opportunities into the pipeline</p>
      </div>

      {/* Stepper */}
      <StepIndicator current={step} />

      {step === 'upload' && (
        <UploadStep
          fileRef={fileRef}
          fileName={fileName}
          onParsed={(data, hdrs, name) => {
            setRawData(data);
            setHeaders(hdrs);
            setFileName(name);
            // Auto-map headers by fuzzy match
            const autoMap: Record<string, string> = {};
            MAPPABLE_FIELDS.forEach(f => {
              const match = hdrs.find(h =>
                h.toLowerCase().replace(/[^a-z]/g, '').includes(f.key.replace(/_/g, '')) ||
                h.toLowerCase().includes(f.label.toLowerCase().split(' ')[0].toLowerCase())
              );
              if (match) autoMap[f.key] = match;
            });
            setMapping(autoMap as any);
            setStep('mapping');
          }}
        />
      )}

      {step === 'mapping' && (
        <MappingStep
          headers={headers}
          mapping={mapping}
          setMapping={setMapping}
          rowCount={rawData.length}
          sampleRow={rawData[0]}
          onBack={() => setStep('upload')}
          onNext={() => {
            const rows = processRows(rawData, mapping);
            setMappedRows(rows);
            setStep('review');
          }}
        />
      )}

      {step === 'review' && (
        <ReviewStep
          rows={mappedRows}
          setRows={setMappedRows}
          onBack={() => setStep('mapping')}
          onImport={(count) => {
            setImportedCount(count);
            setStep('done');
          }}
        />
      )}

      {step === 'done' && (
        <DoneStep
          count={importedCount}
          onReset={() => {
            setStep('upload');
            setRawData([]);
            setHeaders([]);
            setMapping({} as any);
            setMappedRows([]);
            setFileName('');
            setImportedCount(0);
          }}
        />
      )}
    </div>
  );
}

/* ─── Step Indicator ─── */

const STEPS: { key: Step; label: string }[] = [
  { key: 'upload', label: 'Upload File' },
  { key: 'mapping', label: 'Map Columns' },
  { key: 'review', label: 'Review & Import' },
  { key: 'done', label: 'Complete' },
];

function StepIndicator({ current }: { current: Step }) {
  const currentIdx = STEPS.findIndex(s => s.key === current);
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((s, i) => (
        <div key={s.key} className="flex items-center">
          <div className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
            i === currentIdx ? 'bg-primary text-primary-foreground' :
            i < currentIdx ? 'bg-primary/20 text-primary' :
            'bg-muted text-muted-foreground'
          )}>
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold border border-current">
              {i < currentIdx ? '✓' : i + 1}
            </span>
            {s.label}
          </div>
          {i < STEPS.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground mx-1" />}
        </div>
      ))}
    </div>
  );
}

/* ─── Upload Step ─── */

function UploadStep({ fileRef, fileName, onParsed }: {
  fileRef: React.RefObject<HTMLInputElement>;
  fileName: string;
  onParsed: (data: ParsedRow[], headers: string[], name: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const processFile = async (file: File) => {
    setError('');
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
      setError('Please upload an .xlsx, .xls, or .csv file');
      return;
    }
    try {
      const XLSX = await import('xlsx');
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json<ParsedRow>(ws, { defval: '' });
          if (json.length === 0) {
            setError('File is empty or has no data rows');
            return;
          }
          const headers = Object.keys(json[0]);
          onParsed(json, headers, file.name);
        } catch {
          setError('Failed to parse file. Please check the format.');
        }
      };
      reader.readAsArrayBuffer(file);
    } catch {
      setError('Failed to load file parser.');
    }
  };

  return (
    <div
      className={cn(
        'data-panel flex flex-col items-center justify-center py-16 border-2 border-dashed transition-colors cursor-pointer',
        dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
      )}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
      }}
      onClick={() => fileRef.current?.click()}
    >
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) processFile(file);
        }}
      />
      <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-sm font-medium mb-1">Drop your Excel or CSV file here</p>
      <p className="text-xs text-muted-foreground mb-4">Supports .xlsx, .xls, and .csv files</p>
      <Button size="sm" variant="outline" className="text-xs">
        <Upload className="h-3 w-3 mr-1" />Browse Files
      </Button>
      {error && (
        <p className="text-xs text-destructive mt-3 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />{error}
        </p>
      )}
    </div>
  );
}

/* ─── Mapping Step ─── */

function MappingStep({ headers, mapping, setMapping, rowCount, sampleRow, onBack, onNext }: {
  headers: string[];
  mapping: Record<MappableKey, string>;
  setMapping: (m: Record<MappableKey, string>) => void;
  rowCount: number;
  sampleRow?: ParsedRow;
  onBack: () => void;
  onNext: () => void;
}) {
  const requiredMissing = MAPPABLE_FIELDS.filter(f => f.required && !mapping[f.key]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="consulting-headline">Column Mapping</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{rowCount} rows detected. Map your spreadsheet columns to opportunity fields.</p>
        </div>
      </div>

      <div className="data-panel p-0 overflow-hidden">
        <table className="w-full table-compact">
          <thead>
            <tr>
              <th className="text-left w-1/4">Field</th>
              <th className="text-left w-1/3">Spreadsheet Column</th>
              <th className="text-left">Sample Value</th>
            </tr>
          </thead>
          <tbody>
            {MAPPABLE_FIELDS.map(field => (
              <tr key={field.key}>
                <td>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium">{field.label}</span>
                    {field.required && <span className="text-destructive text-[10px]">*</span>}
                  </div>
                </td>
                <td>
                  <select
                    value={mapping[field.key] || ''}
                    onChange={e => setMapping({ ...mapping, [field.key]: e.target.value })}
                    className={cn(
                      'w-full h-8 rounded-md border px-2 text-xs',
                      mapping[field.key] ? 'border-primary/40 bg-primary/5' : 'border-input bg-muted'
                    )}
                  >
                    <option value="">— Skip —</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </td>
                <td className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {mapping[field.key] && sampleRow ? String(sampleRow[mapping[field.key]] || '—') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {requiredMissing.length > 0 && (
        <p className="text-xs text-warning flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Required fields not mapped: {requiredMissing.map(f => f.label).join(', ')}
        </p>
      )}

      <div className="flex justify-between">
        <Button variant="outline" size="sm" onClick={onBack}><ArrowLeft className="h-3 w-3 mr-1" />Back</Button>
        <Button size="sm" onClick={onNext} disabled={requiredMissing.length > 0}>
          Review Data <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </div>
    </div>
  );
}

/* ─── Process & Dedup ─── */

function processRows(rawData: ParsedRow[], mapping: Record<MappableKey, string>): MappedRow[] {
  return rawData.map((row, idx) => {
    const get = (key: MappableKey) => mapping[key] ? String(row[mapping[key]] || '').trim() : '';

    const oppTitle = get('opportunity_title');
    const accountName = get('account_name');
    const country = get('country');
    const stage = get('stage') as Stage || 'Prospect';
    const valueStr = get('est_value_sgd');
    const value = valueStr ? parseFloat(valueStr.replace(/[^0-9.]/g, '')) : 0;
    const tagsStr = get('tags');

    const errors: string[] = [];
    if (!oppTitle) errors.push('Missing opportunity title');
    if (!accountName) errors.push('Missing account name');
    if (!country) errors.push('Missing country');
    if (stage && !STAGES_ORDERED.includes(stage as Stage)) errors.push(`Invalid stage: "${stage}"`);
    if (valueStr && isNaN(value)) errors.push('Invalid value');

    // Account matching
    const accountMatch = mockAccounts.find(a =>
      a.account_name.toLowerCase() === accountName.toLowerCase()
    );

    // Opportunity duplicate check
    const oppDuplicate = mockOpportunities.find(o =>
      o.opportunity_title.toLowerCase() === oppTitle.toLowerCase()
    );

    return {
      opportunity_title: oppTitle,
      account_name: accountName,
      country,
      workstream: get('workstream') || undefined,
      stage: STAGES_ORDERED.includes(stage as Stage) ? stage : 'Prospect',
      est_value_sgd: isNaN(value) ? 0 : value,
      source: get('source') || undefined,
      primary_contact_free_text: get('primary_contact_free_text') || undefined,
      notes: get('notes') || undefined,
      tags: tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      expected_close_month: get('expected_close_month') || undefined,
      _accountMatch: accountMatch ? { id: accountMatch.id, name: accountMatch.account_name } : null,
      _oppDuplicate: oppDuplicate ? { id: oppDuplicate.id, title: oppDuplicate.opportunity_title } : null,
      _isNewAccount: !accountMatch,
      _rowIndex: idx,
      _selected: !oppDuplicate && errors.length === 0,
      _hasError: errors.length > 0,
      _errors: errors,
    };
  });
}

/* ─── Review Step ─── */

function ReviewStep({ rows, setRows, onBack, onImport }: {
  rows: MappedRow[];
  setRows: (r: MappedRow[]) => void;
  onBack: () => void;
  onImport: (count: number) => void;
}) {
  const stats = useMemo(() => ({
    total: rows.length,
    selected: rows.filter(r => r._selected).length,
    duplicates: rows.filter(r => r._oppDuplicate).length,
    newAccounts: rows.filter(r => r._isNewAccount && r._selected).length,
    errors: rows.filter(r => r._hasError).length,
  }), [rows]);

  const toggleRow = (idx: number) => {
    setRows(rows.map((r, i) => i === idx ? { ...r, _selected: !r._selected } : r));
  };

  const toggleAll = (selected: boolean) => {
    setRows(rows.map(r => ({ ...r, _selected: r._hasError ? false : selected })));
  };

  const handleImport = () => {
    const toImport = rows.filter(r => r._selected);
    if (toImport.length === 0) {
      toast.error('No rows selected for import');
      return;
    }
    // In a real app this would write to the database
    toast.success(`${toImport.length} opportunities imported successfully`);
    onImport(toImport.length);
  };

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex gap-3 flex-wrap">
        <div className="kpi-card flex-1 min-w-[120px]">
          <p className="section-label mb-1">Total Rows</p>
          <p className="text-lg font-bold">{stats.total}</p>
        </div>
        <div className="kpi-card flex-1 min-w-[120px]">
          <p className="section-label mb-1">Selected</p>
          <p className="text-lg font-bold text-primary">{stats.selected}</p>
        </div>
        <div className="kpi-card flex-1 min-w-[120px]">
          <p className="section-label mb-1">Duplicates</p>
          <p className={cn('text-lg font-bold', stats.duplicates > 0 && 'text-warning')}>{stats.duplicates}</p>
        </div>
        <div className="kpi-card flex-1 min-w-[120px]">
          <p className="section-label mb-1">New Accounts</p>
          <p className="text-lg font-bold">{stats.newAccounts}</p>
        </div>
        <div className="kpi-card flex-1 min-w-[120px]">
          <p className="section-label mb-1">Errors</p>
          <p className={cn('text-lg font-bold', stats.errors > 0 && 'text-destructive')}>{stats.errors}</p>
        </div>
      </div>

      {/* Bulk actions */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="text-xs" onClick={() => toggleAll(true)}>Select All Valid</Button>
        <Button variant="outline" size="sm" className="text-xs" onClick={() => toggleAll(false)}>Deselect All</Button>
      </div>

      {/* Data table */}
      <div className="data-panel overflow-x-auto p-0 max-h-[480px] overflow-y-auto">
        <table className="w-full table-compact">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="text-center w-10">Import</th>
              <th className="text-center w-8">#</th>
              <th className="text-left">Opportunity</th>
              <th className="text-left">Account</th>
              <th className="text-left">Country</th>
              <th className="text-left">Stage</th>
              <th className="text-right">Value</th>
              <th className="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className={cn(
                !row._selected && 'opacity-40',
                row._hasError && 'bg-destructive/5'
              )}>
                <td className="text-center">
                  <input
                    type="checkbox"
                    checked={row._selected}
                    onChange={() => toggleRow(idx)}
                    disabled={row._hasError}
                    className="rounded border-input"
                  />
                </td>
                <td className="text-center text-muted-foreground text-xs">{idx + 1}</td>
                <td>
                  <span className="text-sm font-medium">{row.opportunity_title || '—'}</span>
                </td>
                <td>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{row.account_name || '—'}</span>
                    {row._isNewAccount && row.account_name && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 text-warning border-warning/30">New</Badge>
                    )}
                    {row._accountMatch && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 text-success border-success/30">Match</Badge>
                    )}
                  </div>
                </td>
                <td className="text-muted-foreground text-xs">{row.country || '—'}</td>
                <td className="text-xs">{row.stage || 'Prospect'}</td>
                <td className="text-right sgd-value text-xs">
                  {row.est_value_sgd ? `$${row.est_value_sgd.toLocaleString()}` : '—'}
                </td>
                <td className="text-center">
                  {row._hasError ? (
                    <Badge variant="destructive" className="text-[9px] px-1.5 py-0" title={row._errors.join(', ')}>
                      Error
                    </Badge>
                  ) : row._oppDuplicate ? (
                    <Badge variant="warning" className="text-[9px] px-1.5 py-0" title={`Duplicate: "${row._oppDuplicate.title}"`}>
                      Duplicate
                    </Badge>
                  ) : (
                    <Badge variant="success" className="text-[9px] px-1.5 py-0">Ready</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Error details */}
      {stats.errors > 0 && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-xs font-medium text-destructive mb-1">Rows with errors (will not be imported):</p>
          {rows.filter(r => r._hasError).slice(0, 5).map((r, i) => (
            <p key={i} className="text-[11px] text-muted-foreground">
              Row {r._rowIndex + 1}: {r._errors.join('; ')}
            </p>
          ))}
          {rows.filter(r => r._hasError).length > 5 && (
            <p className="text-[11px] text-muted-foreground">...and {rows.filter(r => r._hasError).length - 5} more</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" size="sm" onClick={onBack}><ArrowLeft className="h-3 w-3 mr-1" />Back to Mapping</Button>
        <Button size="sm" onClick={handleImport} disabled={stats.selected === 0}>
          <Check className="h-3 w-3 mr-1" />Import {stats.selected} Opportunities
        </Button>
      </div>
    </div>
  );
}

/* ─── Done Step ─── */

function DoneStep({ count, onReset }: { count: number; onReset: () => void }) {
  return (
    <div className="data-panel flex flex-col items-center justify-center py-16">
      <div className="w-14 h-14 rounded-full bg-success/20 flex items-center justify-center mb-4">
        <Check className="h-7 w-7 text-success" />
      </div>
      <h2 className="text-lg font-semibold mb-1">Import Complete</h2>
      <p className="text-sm text-muted-foreground mb-6">{count} opportunities have been imported into the pipeline.</p>
      <div className="flex gap-3">
        <Button variant="outline" size="sm" onClick={onReset}>
          <RefreshCw className="h-3 w-3 mr-1" />Import Another File
        </Button>
        <Button size="sm" asChild>
          <a href="/pipeline">View Pipeline</a>
        </Button>
      </div>
    </div>
  );
}
