'use client';

import { useEffect, useRef, useState } from 'react';
import { Bold, Download, FilePlus2, FileText, Heading1, Italic, Link2, List, ListOrdered, MoreHorizontal, Sparkles, Underline, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { defaultLocalSpaces, loadLocalSpaces, localId, saveLocalSpaces, type LocalDocumentBlockStyle, type LocalSpace } from '../model/local-navigation';
import { exportDocx, importDocx, sanitizeDocumentHtml } from '../lib/document-file';
import { useArchiveDocumentMutation, useCreateDocumentMutation, useUpdateDocumentMutation } from '../data/document-queries';
import { useWorkspaceNavigationQuery } from '../data/workspace-queries';

type DocumentCommand = {
  name: string;
  style: LocalDocumentBlockStyle;
  placeholder: string;
};

const commands: DocumentCommand[] = [
  { name: 'Normal text', style: 'normal', placeholder: 'Write, press space for AI, / for commands' },
  { name: 'Heading 1', style: 'heading-1', placeholder: 'Heading 1' },
  { name: 'Heading 2', style: 'heading-2', placeholder: 'Heading 2' },
  { name: 'Heading 3', style: 'heading-3', placeholder: 'Heading 3' },
  { name: 'Checklist', style: 'checklist', placeholder: 'To-do' },
  { name: 'Bulleted list', style: 'bulleted', placeholder: 'List item' },
  { name: 'Numbered list', style: 'numbered', placeholder: 'List item' },
  { name: 'Toggle list', style: 'toggle', placeholder: 'Toggle' },
  { name: 'Banner', style: 'banner', placeholder: 'Write a banner' },
  { name: 'Code block', style: 'code', placeholder: 'Write code' },
  { name: 'Block quote', style: 'quote', placeholder: 'Quote' },
];

const blockStyleClassNames: Record<LocalDocumentBlockStyle, string> = {
  normal: 'text-base leading-7',
  'heading-1': 'text-4xl font-bold leading-tight tracking-tight',
  'heading-2': 'text-3xl font-bold leading-tight tracking-tight',
  'heading-3': 'text-2xl font-semibold leading-tight',
  checklist: 'pl-7 text-base leading-7 before:absolute before:left-0 before:top-1.5 before:h-4 before:w-4 before:rounded before:border before:border-slate-400',
  bulleted: 'pl-6 text-base leading-7 before:absolute before:left-1 before:top-3 before:h-2 before:w-2 before:rounded-full before:bg-slate-400',
  numbered: "pl-7 text-base leading-7 before:absolute before:left-0 before:top-0 before:text-sm before:text-slate-500 before:content-['1.']",
  toggle: "pl-6 text-base leading-7 before:absolute before:left-0 before:top-0 before:text-slate-500 before:content-['>']",
  banner: 'rounded-lg bg-indigo-50 px-4 py-3 text-base leading-7 text-indigo-950 dark:bg-indigo-950/35 dark:text-indigo-100',
  code: 'rounded-lg bg-slate-100 px-4 py-3 font-mono text-sm leading-6 dark:bg-slate-900',
  quote: 'border-l-4 border-indigo-400 pl-4 text-lg italic leading-8 text-slate-600 dark:text-slate-300',
};

function activeBlockTextBeforeCursor(editor: HTMLDivElement, fallbackText: string) {
  const selection = window.getSelection();
  const anchorNode = selection?.anchorNode;
  if (!anchorNode || !editor.contains(anchorNode)) return fallbackText;

  const anchorElement = anchorNode.nodeType === 1 ? anchorNode as HTMLElement : anchorNode.parentElement;
  const block = anchorElement?.closest('p,h1,h2,h3,h4,h5,h6,li,blockquote,pre,div');
  if (!block || !editor.contains(block)) return fallbackText;

  try {
    const range = document.createRange();
    range.selectNodeContents(block);
    range.setEnd(anchorNode, selection?.anchorOffset ?? 0);
    return range.toString();
  } catch {
    return fallbackText;
  }
}
export function DocumentWorkspace() {
  const [spaces, setSpaces] = useState<LocalSpace[]>(defaultLocalSpaces);
  const [locationQuery, setLocationQuery] = useState('');
  const navigationQuery = useWorkspaceNavigationQuery();
  const effectiveSpaces = navigationQuery.data ?? spaces;
  const query = new URLSearchParams(locationQuery);
  const selectedSpace = effectiveSpaces.find((space) => space.id === query.get('space')) ?? effectiveSpaces[0];
  const selectedDoc = selectedSpace?.items.find((item) => item.id === query.get('doc') && item.kind === 'doc');
  const selectedFolder = selectedSpace?.items.find((item) => item.id === selectedDoc?.parentId && item.kind === 'folder');
  const pages = selectedSpace?.items.filter((item) => item.kind === 'doc' && item.parentId === selectedDoc?.parentId) ?? [];
  const linkableTasks = selectedSpace?.items.filter((item) => item.kind === 'list').flatMap((item) => item.tasks ?? []) ?? [];
  const linkableDocs = selectedSpace?.items.filter((item) => item.kind === 'doc' && item.id !== selectedDoc?.id) ?? [];
  const blockStyle = selectedDoc?.document?.style ?? 'normal';
  const editorRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [slashQuery, setSlashQuery] = useState<string | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [pageMenuId, setPageMenuId] = useState<string | null>(null);
  const [importTargetPageId, setImportTargetPageId] = useState<string | null>(null);
  const [fileMessage, setFileMessage] = useState<string | null>(null);
  const [isRenamingTitle, setIsRenamingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const createDocumentMutation = useCreateDocumentMutation();
  const updateDocumentMutation = useUpdateDocumentMutation();
  const archiveDocumentMutation = useArchiveDocumentMutation();
  const versionRef = useRef(new Map<string, number>());
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const contentSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  useEffect(() => {
    const refresh = () => {
      setSpaces(loadLocalSpaces());
      setLocationQuery(window.location.search);
    };
    refresh();
    window.addEventListener('clickflow:local-spaces-changed', refresh);
    window.addEventListener('clickflow:space-navigation', refresh);
    window.addEventListener('popstate', refresh);
    return () => {
      window.removeEventListener('clickflow:local-spaces-changed', refresh);
      window.removeEventListener('clickflow:space-navigation', refresh);
      window.removeEventListener('popstate', refresh);
    };
  }, []);

  useEffect(() => {
    if (!isRenamingTitle || !titleRef.current) return;
    titleRef.current.focus();
    const range = document.createRange();
    range.selectNodeContents(titleRef.current);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, [isRenamingTitle]);


  useEffect(() => {
    if (selectedDoc?.document?.contentVersion) versionRef.current.set(selectedDoc.id, selectedDoc.document.contentVersion);
  }, [selectedDoc?.id, selectedDoc?.document?.contentVersion]);

  useEffect(() => () => {
    if (contentSaveTimerRef.current) clearTimeout(contentSaveTimerRef.current);
  }, []);

  const queueApiUpdate = (documentId: string, patch: { title?: string; content?: string }, delay = 0) => {
    const run = () => {
      setSaveState('saving');
      saveQueueRef.current = saveQueueRef.current
        .catch(() => undefined)
        .then(async () => {
          const contentVersion = versionRef.current.get(documentId);
          if (!selectedSpace || !contentVersion) throw new Error('Document version is unavailable');
          const updated = await updateDocumentMutation.mutateAsync({
            workspaceId: selectedSpace.id,
            documentId,
            input: { contentVersion, ...patch }
          });
          versionRef.current.set(documentId, updated.contentVersion);
          setSaveState('saved');
        })
        .catch(() => {
          setSaveState('error');
          setFileMessage('Could not save the latest document changes. Refresh and try again.');
        });
    };
    if (delay > 0) {
      if (contentSaveTimerRef.current) clearTimeout(contentSaveTimerRef.current);
      contentSaveTimerRef.current = setTimeout(run, delay);
    } else run();
  };
  const openPage = (docId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('doc', docId);
    window.history.pushState(null, '', url);
    setLocationQuery(url.search);
  };

  const saveContent = (nextContent: string, nextBlockStyle = blockStyle, announce = false) => {
    if (!selectedSpace || !selectedDoc) return;
    if (navigationQuery.usesApi) {
      queueApiUpdate(selectedDoc.id, { content: nextContent }, 500);
      return;
    }
    const updatedAt = new Date().toISOString();
    const sourceSpaces = loadLocalSpaces();
    const nextSpaces = sourceSpaces.map((space) => space.id === selectedSpace.id ? {
      ...space,
      items: space.items.map((item) => item.id === selectedDoc.id ? { ...item, document: { content: nextContent, updatedAt, style: nextBlockStyle } } : item),
    } : space);
    saveLocalSpaces(nextSpaces, announce);
    if (announce) setSpaces(nextSpaces);
  };

  const handleEditorInput = (nextContent: string, plainText: string, editor: HTMLDivElement) => {
    const safeContent = sanitizeDocumentHtml(nextContent);
    saveContent(safeContent);
    const match = activeBlockTextBeforeCursor(editor, plainText).match(/(?:^|\s)\/([^\s/]*)$/);
    setSlashQuery(match ? match[1].toLowerCase() : null);
  };

  const applySelectionFormat = (command: string, value?: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    document.execCommand(command, false, value);
    saveContent(editor.innerHTML);
  };
  const createSelectionLink = () => {
    const href = window.prompt('Paste a link')?.trim();
    if (href) applySelectionFormat('createLink', href);
  };

  const insertCommand = (command: DocumentCommand) => {
    const current = editorRef.current?.textContent ?? '';
    const nextContent = current.replace(/(?:^|\n)\/[^\s\n]*$/, (match) => match.startsWith('\n') ? '\n' : '');
    if (editorRef.current) editorRef.current.textContent = nextContent;
    saveContent(nextContent, command.style, true);
    setSlashQuery(null);
    editorRef.current?.focus();
  };
  const insertReference = (reference: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    if (editor.childNodes.length) editor.append(document.createElement('br'));
    editor.append(document.createTextNode(reference));
    saveContent(editor.innerHTML, blockStyle, true);
    setLinkOpen(false);
    editor.focus();
  };
  const updatePage = (pageId: string, patch: Record<string, unknown>) => {
    if (!selectedSpace) return;
    if (navigationQuery.usesApi) {
      if (typeof patch.name === 'string') queueApiUpdate(pageId, { title: patch.name });
      return;
    }
    const nextSpaces = spaces.map((space) => space.id === selectedSpace.id ? { ...space, items: space.items.map((item) => item.id === pageId ? { ...item, ...patch } : item) } : space);
    setSpaces(nextSpaces);
    saveLocalSpaces(nextSpaces);
  };

  const renamePage = (pageId: string, currentName: string) => {
    const name = window.prompt('Rename page', currentName)?.trim();
    if (name) updatePage(pageId, { name });
    setPageMenuId(null);
  };
  const startTitleRename = () => {
    setTitleDraft(selectedDoc?.name ?? '');
    setIsRenamingTitle(true);
  };
  const commitTitleRename = () => {
    const name = titleRef.current?.textContent?.trim() ?? '';
    if (name && selectedDoc) updatePage(selectedDoc.id, { name });
    setIsRenamingTitle(false);
  };

  const duplicatePage = (pageId: string) => {
    const page = pages.find((item) => item.id === pageId);
    if (!page || !selectedSpace) return;
    const copyId = localId('doc');
    if (navigationQuery.usesApi) {
      void createDocumentMutation.mutateAsync({
        workspaceId: selectedSpace.id,
        input: { title: `${page.name} copy`, projectId: page.parentId ?? null, content: page.document?.content ?? '' }
      }).then((created) => {
        versionRef.current.set(created.id, created.contentVersion);
        openPage(created.id);
      }).catch(() => setFileMessage('Could not duplicate this page.'));
      setPageMenuId(null);
      return;
    }

    const nextSpaces = spaces.map((space) => space.id === selectedSpace.id ? { ...space, items: [...space.items, { ...page, id: copyId, name: `${page.name} copy`, document: { content: page.document?.content ?? '', updatedAt: new Date().toISOString() } }] } : space);
    setSpaces(nextSpaces);
    saveLocalSpaces(nextSpaces);
    openPage(copyId);
    setPageMenuId(null);
  };

  const deletePage = (pageId: string) => {
    if (!selectedSpace || !selectedDoc || pages.length === 1) return;
    const nextSpaces = spaces.map((space) => space.id === selectedSpace.id ? { ...space, items: space.items.filter((item) => item.id !== pageId) } : space);
    if (navigationQuery.usesApi) {
      const version = versionRef.current.get(pageId) ?? pages.find((page) => page.id === pageId)?.document?.contentVersion;
      if (!version) return;
      void archiveDocumentMutation.mutateAsync({ workspaceId: selectedSpace.id, documentId: pageId, contentVersion: version })
        .then(() => {
          if (pageId === selectedDoc.id) openPage(pages.find((page) => page.id !== pageId)!.id);
        })
        .catch(() => setFileMessage('Could not delete this page.'));
      setPageMenuId(null);
      return;
    }

    setSpaces(nextSpaces);
    saveLocalSpaces(nextSpaces);
    setPageMenuId(null);
    if (pageId === selectedDoc.id) openPage(pages.find((page) => page.id !== pageId)!.id);
  };

  const copyPageLink = async (pageId: string) => {
    await navigator.clipboard?.writeText(`${window.location.origin}/projects?space=${selectedSpace?.id}&folder=${selectedFolder?.id ?? ''}&doc=${pageId}`);
    setPageMenuId(null);
  };
  const importPage = (pageId: string) => {
    setImportTargetPageId(pageId);
    setPageMenuId(null);
    importInputRef.current?.click();
  };

  const handleDocxImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const pageId = importTargetPageId;
    event.target.value = '';
    if (!file || !pageId || !selectedSpace) return;

    try {
      const importedContent = await importDocx(file);
      if (navigationQuery.usesApi) {
        queueApiUpdate(pageId, { content: importedContent });
        setFileMessage(`Imported ${file.name}`);
        openPage(pageId);
        return;
      }

      const updatedAt = new Date().toISOString();
      const nextSpaces = spaces.map((space) => space.id === selectedSpace.id ? {
        ...space,
        items: space.items.map((item) => item.id === pageId ? { ...item, document: { content: importedContent, updatedAt, style: 'normal' as LocalDocumentBlockStyle } } : item),
      } : space);
      setSpaces(nextSpaces);
      saveLocalSpaces(nextSpaces);
      setFileMessage(`Imported ${file.name}`);
      openPage(pageId);
    } catch (error) {
      setFileMessage(error instanceof Error ? error.message : 'Could not import this Word file.');
    } finally {
      setImportTargetPageId(null);
    }
  };

  const exportPage = async (pageId: string) => {
    const page = pages.find((item) => item.id === pageId);
    if (!page) return;
    try {
      const blob = await exportDocx(page.name, page.document?.content ?? '');
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${page.name.replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '') || 'clickflow-document'}.docx`;
      link.click();
      URL.revokeObjectURL(link.href);
      setFileMessage(`Exported ${page.name}.docx`);
    } catch {
      setFileMessage('Could not export this Word file.');
    }
    setPageMenuId(null);
  };
  const addPage = () => {
    if (!selectedSpace || !selectedDoc) return;
    const name = `Untitled page ${pages.length + 1}`;
    const pageId = localId('doc');
    if (navigationQuery.usesApi) {
      void createDocumentMutation.mutateAsync({
        workspaceId: selectedSpace.id,
        input: { title: name, projectId: selectedDoc.parentId ?? null, content: '' }
      }).then((created) => {
        versionRef.current.set(created.id, created.contentVersion);
        openPage(created.id);
      }).catch(() => setFileMessage('Could not create a new page.'));
      return;
    }

    const nextSpaces = spaces.map((space) => space.id === selectedSpace.id ? {
      ...space,
      items: [...space.items, { id: pageId, name, kind: 'doc' as const, parentId: selectedDoc.parentId, document: { content: '', updatedAt: new Date().toISOString() } }],
    } : space);
    setSpaces(nextSpaces);
    saveLocalSpaces(nextSpaces);
    const url = new URL(window.location.href);
    url.searchParams.set('doc', pageId);
    window.history.pushState(null, '', url);
    setLocationQuery(url.search);
  };


  if (!selectedDoc || !selectedSpace) return null;

  return <main className="min-h-[calc(100vh-4rem)] bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <header className="sticky top-16 z-20 flex min-h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="flex min-w-0 items-center gap-2 text-sm text-slate-500"><span>{selectedSpace.name}</span><span>/</span><span>{selectedFolder?.name ?? 'Docs'}</span><span>/</span><span className="truncate font-semibold text-slate-900 dark:text-white">{selectedDoc.name}</span></div>
      <div className="flex items-center gap-2"><Button size="sm" variant="ghost"><Sparkles size={15} />ClickFlow AI</Button><Button size="sm" variant="outline">Share</Button><button aria-label="Document options" type="button" className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"><MoreHorizontal size={18} /></button></div>
    </header>
    <div className="grid min-h-[calc(100vh-7.5rem)] grid-cols-1 lg:grid-cols-[19rem_minmax(0,1fr)]">
      <aside className="border-b border-slate-200 p-4 lg:sticky lg:top-[7.5rem] lg:h-[calc(100vh-7.5rem)] lg:self-start lg:overflow-y-auto lg:border-b-0 lg:border-r dark:border-slate-800"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold">{selectedFolder?.name ?? 'Pages'}</p><p className="mt-1 text-xs text-slate-500">Pages</p></div><button aria-label="Add page" type="button" onClick={addPage} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-900"><FilePlus2 size={17} /></button></div><input ref={importInputRef} type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => void handleDocxImport(event)} className="sr-only" /><nav className="mt-4 space-y-1">{pages.map((page) => <div key={page.id} className="relative flex items-center"><button type="button" onClick={() => openPage(page.id)} aria-current={page.id === selectedDoc.id ? 'page' : undefined} className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${page.id === selectedDoc.id ? 'bg-slate-900/10 font-semibold text-slate-900 dark:bg-white/10 dark:text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'}`}><FileText size={16} />{page.name}</button><button type="button" aria-label={`Page options ${page.name}`} onClick={() => setPageMenuId((current) => current === page.id ? null : page.id)} className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><MoreHorizontal size={15} /></button>{pageMenuId === page.id && <div role="menu" className="absolute right-0 top-8 z-30 w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900"><button type="button" role="menuitem" onClick={() => renamePage(page.id, page.name)} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Rename page</button><button type="button" role="menuitem" onClick={() => void copyPageLink(page.id)} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Copy link</button><button type="button" role="menuitem" onClick={() => importPage(page.id)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><Upload size={14} />Import .docx</button><button type="button" role="menuitem" onClick={() => void exportPage(page.id)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><Download size={14} />Export .docx</button><button type="button" role="menuitem" onClick={() => duplicatePage(page.id)} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Duplicate page</button><button type="button" role="menuitem" disabled={pages.length === 1} onClick={() => deletePage(page.id)} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 disabled:opacity-40 dark:hover:bg-rose-950/30">Delete page</button></div>}</div>)}</nav>{fileMessage && <p role="status" className="mt-3 text-xs text-slate-500">{fileMessage}</p>}<button type="button" onClick={addPage} className="mt-3 flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-indigo-600"><FilePlus2 size={16} />Add page</button></aside>
      <section className="w-full px-8 py-10 lg:px-12"><p className="text-sm text-slate-500">{selectedFolder?.name ?? selectedSpace.name} <span className="px-1">/</span> Docs</p><div className="relative mt-4 inline-block"><button type="button" aria-label="Link Task or Doc" onClick={() => setLinkOpen((open) => !open)} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600"><Link2 size={15} />Link Task or Doc</button>{linkOpen && <div role="menu" aria-label="Link task or document" className="absolute left-0 top-7 z-20 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900"><p className="px-2 py-1 text-xs font-semibold text-slate-500">Tasks</p>{linkableTasks.length ? linkableTasks.map((task) => <button key={task.id} type="button" role="menuitem" onClick={() => insertReference(`[Task: ${task.title}]`)} className="block w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Task: {task.title}</button>) : <p className="px-2 py-2 text-sm text-slate-500">No tasks yet</p>}<p className="mt-1 border-t border-slate-100 px-2 py-2 text-xs font-semibold text-slate-500 dark:border-slate-800">Docs</p>{linkableDocs.map((doc) => <button key={doc.id} type="button" role="menuitem" onClick={() => insertReference(`[[${doc.name}]]`)} className="block w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Doc: {doc.name}</button>)}</div>}</div><h1 ref={titleRef} role={isRenamingTitle ? 'textbox' : undefined} aria-label={isRenamingTitle ? 'Document title' : undefined} contentEditable={isRenamingTitle} suppressContentEditableWarning tabIndex={0} onClick={() => { if (!isRenamingTitle) startTitleRename(); }} onBlur={commitTitleRename} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); commitTitleRename(); } if (event.key === 'Escape') { event.preventDefault(); setIsRenamingTitle(false); } }} className="mt-4 max-w-full cursor-text text-4xl font-bold leading-tight tracking-tight outline-none">{isRenamingTitle ? titleDraft : selectedDoc.name}</h1><div className="mt-3 flex items-center gap-2 text-sm text-slate-500"><span className="grid h-6 w-6 place-items-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">KT</span><span>Khanh Tran</span><span>|</span><span>{navigationQuery.usesApi ? saveState === 'saving' ? 'Saving...' : saveState === 'error' ? 'Save failed' : 'Saved to workspace' : 'Saved locally'}</span></div><div className="relative mt-8"><div role="toolbar" aria-label="Text formatting" className="sticky top-32 z-10 mb-3 flex w-fit items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900"><button type="button" aria-label="Bold selection" onMouseDown={(event) => event.preventDefault()} onClick={() => applySelectionFormat('bold')} className="rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><Bold size={16} /></button><button type="button" aria-label="Italic selection" onMouseDown={(event) => event.preventDefault()} onClick={() => applySelectionFormat('italic')} className="rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><Italic size={16} /></button><button type="button" aria-label="Underline selection" onMouseDown={(event) => event.preventDefault()} onClick={() => applySelectionFormat('underline')} className="rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><Underline size={16} /></button><span className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-700" /><button type="button" aria-label="Heading selection" onMouseDown={(event) => event.preventDefault()} onClick={() => applySelectionFormat('formatBlock', 'h2')} className="rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><Heading1 size={16} /></button><button type="button" aria-label="Bulleted list selection" onMouseDown={(event) => event.preventDefault()} onClick={() => applySelectionFormat('insertUnorderedList')} className="rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><List size={16} /></button><button type="button" aria-label="Numbered list selection" onMouseDown={(event) => event.preventDefault()} onClick={() => applySelectionFormat('insertOrderedList')} className="rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><ListOrdered size={16} /></button><button type="button" aria-label="Link selection" onMouseDown={(event) => event.preventDefault()} onClick={createSelectionLink} className="rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><Link2 size={16} /></button></div><div key={selectedDoc.id} ref={editorRef} role="textbox" aria-label="Document content" contentEditable suppressContentEditableWarning spellCheck dangerouslySetInnerHTML={{ __html: selectedDoc.document?.content ?? '' }} onInput={(event) => handleEditorInput(event.currentTarget.innerHTML, event.currentTarget.textContent ?? '', event.currentTarget)} data-block-style={blockStyle} data-placeholder={commands.find((command) => command.style === blockStyle)?.placeholder ?? 'Write, press space for AI, / for commands'} className={`relative min-h-[calc(100vh-20rem)] w-full bg-transparent py-2 outline-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)] [&_a]:text-indigo-600 [&_a]:underline [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-400 [&_blockquote]:pl-4 [&_blockquote]:italic [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:font-mono [&_h1]:mt-8 [&_h1]:text-4xl [&_h1]:font-bold [&_h2]:mt-6 [&_h2]:text-3xl [&_h2]:font-bold [&_h3]:mt-5 [&_h3]:text-2xl [&_h3]:font-semibold [&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-xl [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_pre]:my-4 [&_pre]:rounded-lg [&_pre]:bg-slate-100 [&_pre]:p-4 [&_pre]:font-mono [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 dark:[&_code]:bg-slate-900 dark:[&_pre]:bg-slate-900 [&_table]:my-5 [&_table]:w-full [&_table]:border-collapse [&_table]:text-left [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold [&_td]:border [&_td]:border-slate-300 [&_td]:px-3 [&_td]:py-2 [&_td_p]:my-0 dark:[&_th]:border-slate-700 dark:[&_th]:bg-slate-900 dark:[&_td]:border-slate-700 ${blockStyleClassNames[blockStyle]}`} />{slashQuery !== null && <div role="menu" aria-label="Document commands" className="absolute left-0 top-14 z-20 grid w-[34rem] max-w-full grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">{commands.filter((command) => command.name.toLowerCase().includes(slashQuery)).map((command) => <button key={command.name} type="button" role="menuitem" onMouseDown={(event) => event.preventDefault()} onClick={() => insertCommand(command)} className="rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">{command.name}</button>)}</div>}</div></section>
    </div>
  </main>;
}