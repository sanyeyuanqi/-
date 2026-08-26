const TARGET_ORIGIN = 'https://gys.oljuxj.xyz';

type RouteContext = {
  params: Promise<{ path: string[] }> | { path: string[] };
};

function splitSetCookieHeader(value: string) {
  const cookies: string[] = [];
  let start = 0;
  let inExpires = false;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    const chunk = value.slice(Math.max(0, index - 8), index + 1).toLowerCase();

    if (chunk.endsWith('expires=')) {
      inExpires = true;
    }

    if (inExpires && char === ';') {
      inExpires = false;
    }

    if (!inExpires && char === ',') {
      const next = value.slice(index + 1);
      if (/^\s*[^=;,\s]+=/.test(next)) {
        cookies.push(value.slice(start, index).trim());
        start = index + 1;
      }
    }
  }

  const last = value.slice(start).trim();
  if (last) {
    cookies.push(last);
  }

  return cookies;
}

function rewriteCookieForCurrentOrigin(cookie: string, requestUrl: string) {
  const url = new URL(requestUrl);
  let rewritten = cookie.replace(/;\s*Domain=[^;]*/gi, '');

  if (url.protocol === 'http:') {
    rewritten = rewritten.replace(/;\s*Secure/gi, '');
  }

  return rewritten;
}

async function proxy(request: Request, context: RouteContext) {
  const params = await context.params;
  const upstreamUrl = new URL(`/api/${params.path.join('/')}`, TARGET_ORIGIN);
  upstreamUrl.search = new URL(request.url).search;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('connection');
  headers.delete('content-length');
  headers.delete('accept-encoding');
  headers.set('origin', TARGET_ORIGIN);
  headers.set('referer', `${TARGET_ORIGIN}/`);

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual',
  };

  if (!['GET', 'HEAD'].includes(request.method)) {
    init.body = await request.arrayBuffer();
  }

  const upstream = await fetch(upstreamUrl, init);
  const responseHeaders = new Headers();
  const skipHeaders = new Set([
    'connection',
    'content-encoding',
    'content-length',
    'keep-alive',
    'set-cookie',
    'transfer-encoding',
  ]);

  upstream.headers.forEach((value, key) => {
    if (!skipHeaders.has(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  });

  const cookieSource =
    (upstream.headers as Headers & { getSetCookie?: () => string[] })
      .getSetCookie?.() ??
    (upstream.headers.get('set-cookie')
      ? splitSetCookieHeader(upstream.headers.get('set-cookie') ?? '')
      : []);

  cookieSource.forEach((cookie) => {
    responseHeaders.append(
      'set-cookie',
      rewriteCookieForCurrentOrigin(cookie, request.url),
    );
  });

  responseHeaders.set('cache-control', 'no-store');

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
