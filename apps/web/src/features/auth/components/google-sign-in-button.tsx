'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

type CredentialResponse = { credential?: string };
type GoogleIdentityApi = {
  initialize(options: { client_id: string; callback: (response: CredentialResponse) => void; auto_select?: boolean }): void;
  renderButton(parent: HTMLElement, options: Record<string, string | number>): void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdentityApi } };
  }
}

function GoogleMark() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5"><path fill="#4285F4" d="M21.35 12.25c0-.7-.06-1.38-.18-2.03H12v3.84h5.24a4.48 4.48 0 0 1-1.94 2.94v2.49h3.14c1.84-1.7 2.91-4.2 2.91-7.24Z" /><path fill="#34A853" d="M12 21.75c2.62 0 4.82-.86 6.44-2.26l-3.14-2.49c-.87.58-1.99.92-3.3.92-2.53 0-4.67-1.7-5.44-4v2.56H3.31a9.73 9.73 0 0 0 8.69 5.27Z" /><path fill="#FBBC05" d="M6.56 13.92A5.87 5.87 0 0 1 6.26 12c0-.67.12-1.31.3-1.92V7.52H3.31A9.75 9.75 0 0 0 2.25 12c0 1.61.39 3.13 1.06 4.48l3.25-2.56Z" /><path fill="#EA4335" d="M12 6.08c1.42 0 2.69.49 3.69 1.44l2.77-2.77C16.81 3.2 14.61 2.25 12 2.25a9.73 9.73 0 0 0-8.69 5.27l3.25 2.56c.77-2.3 2.91-4 5.44-4Z" /></svg>;
}

export function GoogleSignInButton({
  clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '',
  pending,
  onCredential
}: {
  clientId?: string;
  pending: boolean;
  onCredential: (credential: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  const initializedRef = useRef(false);
  const [scriptReady, setScriptReady] = useState(() => typeof window !== 'undefined' && Boolean(window.google));
  useEffect(() => { callbackRef.current = onCredential; }, [onCredential]);

  const initialize = useCallback(() => {
    if (!clientId || initializedRef.current || !window.google || !containerRef.current) return;
    initializedRef.current = true;
    window.google.accounts.id.initialize({
      client_id: clientId,
      auto_select: false,
      callback: (response) => {
        if (response.credential) callbackRef.current(response.credential);
      }
    });
    const width = Math.min(containerRef.current.clientWidth || 400, 400);
    window.google.accounts.id.renderButton(containerRef.current, {
      type: 'standard', theme: 'outline', size: 'large', text: 'continue_with', shape: 'rectangular', width
    });
  }, [clientId]);

  useEffect(() => { if (scriptReady) initialize(); }, [initialize, scriptReady]);

  if (!clientId) {
    return <Button type="button" variant="outline" disabled aria-label="Continue with Google" title="Google sign-in is not configured" className="h-11 w-full border-slate-700 bg-slate-900/70 text-slate-400"><GoogleMark />Continue with Google</Button>;
  }

  return <div aria-busy={pending} className={pending ? 'pointer-events-none opacity-60' : undefined}>
    <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => setScriptReady(true)} />
    <div
      ref={containerRef}
      data-google-button-host
      className="mx-auto flex min-h-11 w-full max-w-[400px] justify-center overflow-hidden rounded-md"
    />
    {pending && <p role="status" className="mt-2 text-center text-xs text-slate-400">Signing in with Google...</p>}
  </div>;
}
