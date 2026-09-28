export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string) {
    super(`${status} ${code}`);
    this.status = status;
    this.code = code;
  }
}
export class NetworkError extends Error {
  constructor() { super('network'); }
}

export async function api<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers: body === undefined || isForm ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
    });
  } catch {
    throw new NetworkError();
  }
  if (res.status === 204) return undefined as T;
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new ApiError(res.status, data.error ?? 'error');
  return data as T;
}

export function authMessage(err: unknown): string {
  if (err instanceof NetworkError) return 'مفيش اتصال بالإنترنت دلوقتي. جرّب تاني بعد شوية.';
  if (err instanceof ApiError) {
    if (err.code === 'email_taken') return 'الإيميل ده متسجل قبل كده. جرّب تدخل بيه.';
    if (err.code === 'invalid_credentials') return 'الإيميل أو كلمة السر مش مظبوطين.';
    if (err.status === 429) return 'محاولات كتير ورا بعض. استنى دقيقة وجرّب تاني.';
    if (err.status === 400) return 'اتأكد من الإيميل، وإن كلمة السر ٨ حروف على الأقل.';
  }
  return 'حصلت مشكلة. جرّب تاني.';
}
