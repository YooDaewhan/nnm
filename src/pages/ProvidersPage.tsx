import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiProviders, GetApiProviders200Item } from '../api/generated';

export default function ProvidersPage() {
  const [providers, setProviders] = useState<GetApiProviders200Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getApiProviders()
      .then((res) => {
        if (res.status === 200) {
          setProviders(res.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredProviders = providers.filter((provider) => {
    const searchLower = search.toLowerCase();
    return (
      provider.name?.toLowerCase().includes(searchLower) ||
      provider.abbr?.toLowerCase().includes(searchLower) ||
      provider.category?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">학회 목록</h2>

          <input
            type="text"
            placeholder="이름, 약어, 카테고리로 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {loading ? (
            <p className="text-gray-500">불러오는 중...</p>
          ) : filteredProviders.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {filteredProviders.map((provider) => (
                <li key={provider.id} className="py-3">
                  <Link to={`/providers/detail?id=${provider.id}`} className="block hover:bg-gray-50 -mx-2 px-2 py-1 rounded">
                    <p className="font-medium text-gray-900">{provider.name}</p>
                    <p className="text-sm text-gray-500">
                      {provider.abbr} · {provider.category} · {provider.status}
                    </p>
                    <p>{provider.website_url}</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : search ? (
            <p className="text-gray-500">검색 결과가 없습니다.</p>
          ) : (
            <p className="text-gray-500">데이터가 없습니다.</p>
          )}
        </div>
      </main>
    </div>
  );
}
