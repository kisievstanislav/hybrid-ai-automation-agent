export interface HttpRequestOptions {
  readonly headers?: Readonly<Record<string, string>>;
  readonly timeoutMs?: number;
  readonly correlationId?: string;
}

export interface HttpRequestWithBodyOptions<TBody> extends HttpRequestOptions {
  readonly body: TBody;
}

export interface HttpResponse<TData> {
  readonly status: number;
  readonly headers: Readonly<Record<string, string>>;
  readonly data: TData;
}

export interface HttpClient {
  get<TData>(path: string, options?: HttpRequestOptions): Promise<HttpResponse<TData>>;

  post<TData, TBody>(
    path: string,
    options: HttpRequestWithBodyOptions<TBody>,
  ): Promise<HttpResponse<TData>>;

  patch<TData, TBody>(
    path: string,
    options: HttpRequestWithBodyOptions<TBody>,
  ): Promise<HttpResponse<TData>>;
}
