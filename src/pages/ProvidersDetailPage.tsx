import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

interface Provider {
  id?: number;
  abbr?: string;
  name?: string;
  description?: string;
  website_url?: string;
  category?: string;
  status?: string;
}

function ProviderDetailContent() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');

  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('ID가 필요합니다.');
      setLoading(false);
      return;
    }

    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      setError('유효하지 않은 ID입니다.');
      setLoading(false);
      return;
    }

    const url = `http://192.168.20.60:8055/api/providers/${numId}`;
    console.log('Fetching:', url);

    fetch(url)
      .then(async (res) => {
        const text = await res.text();
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${text.substring(0, 100)}`);
        }
        try {
          return JSON.parse(text);
        } catch {
          throw new Error(`Invalid JSON: ${text.substring(0, 100)}`);
        }
      })
      .then((data) => {
        setProvider(data);
      })
      .catch((err) => {
        setError(`오류: ${err.message}`);
      })
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4">
          <Link to="/providers" className="text-blue-600 hover:text-blue-800">
            ← 목록으로 돌아가기
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {loading ? (
            <p className="text-gray-500">불러오는 중...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : provider ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">{provider.name}</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">약어</p>
                  <p className="font-medium">{provider.abbr}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">카테고리</p>
                  <p className="font-medium">{provider.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">상태</p>
                  <p className="font-medium">{provider.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ID</p>
                  <p className="font-medium">{provider.id}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">데이터가 없습니다.</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ProvidersDetailPage() {
  return (
    <Suspense fallback={<p className="p-8 text-gray-500">불러오는 중...</p>}>
      <ProviderDetailContent />
    </Suspense>
  );
}
