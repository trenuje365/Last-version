/**
 * DebugLoggerService
 * Zbiera logi w pamięci i zapisuje je do pliku .txt automatycznie.
 * Wywołaj DebugLoggerService.download() lub window.downloadDebugLogs() z konsoli.
 */

interface LogEntry {
  ts: string;
  tag: string;
  msg: string;
  stack?: string;
}

const entries: LogEntry[] = [];
let sessionStart = new Date().toISOString();

const formatStack = (stack: string | undefined): string | undefined => {
  if (!stack) return undefined;
  // Usuń pierwszą linię (Error) i zostaw tylko 4 kolejne
  return stack.split('\n').slice(1, 5).map(l => l.trim()).join(' | ');
};

export const DebugLoggerService = {
  reset: () => {
    entries.length = 0;
    sessionStart = new Date().toISOString();
    console.log('[DebugLogger] Reset – nowa sesja');
  },

  log: (tag: string, msg: string, withStack = false) => {
    const ts = new Date().toISOString().substring(11, 23);
    const stack = withStack ? formatStack(new Error().stack) : undefined;
    entries.push({ ts, tag, msg, stack });
    // Nadal wypisuj do konsoli
    console.log(`[${ts}] [${tag}] ${msg}${stack ? ` | STACK: ${stack}` : ''}`);
  },

  separator: (label: string) => {
    const line = `${'─'.repeat(20)} ${label} ${'─'.repeat(20)}`;
    entries.push({ ts: '', tag: '---', msg: line });
    console.log(`%c${line}`, 'color: #94a3b8');
  },

  download: (filename?: string) => {
    if (entries.length === 0) {
      console.warn('[DebugLogger] Brak logów do zapisania');
      return;
    }
    const lines = [
      `=== DEBUG LOG SESJI ===`,
      `Start: ${sessionStart}`,
      `Export: ${new Date().toISOString()}`,
      `Liczba wpisów: ${entries.length}`,
      '═'.repeat(60),
      '',
      ...entries.map(e =>
        e.tag === '---'
          ? e.msg
          : `[${e.ts}] [${e.tag}] ${e.msg}${e.stack ? `\n  SKĄD: ${e.stack}` : ''}`
      ),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `debug_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    console.log(`[DebugLogger] Plik zapisany: ${a.download}`);
  },

  getAll: () => [...entries],
  count: () => entries.length,
};

// Eksponuj globalnie – możesz wywołać window.downloadDebugLogs() z konsoli przeglądarki
(window as any).downloadDebugLogs = () => DebugLoggerService.download();
(window as any).debugLogs = DebugLoggerService;
