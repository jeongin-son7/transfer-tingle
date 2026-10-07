import HomeClient from "@/components/HomeClient";
import { fetchLiveData } from "@/lib/supabaseData";

// 매 요청마다 Supabase에서 최신 데이터를 읽어와야 하므로(관리자가 기사를
// 등록할 때마다 바로 반영돼야 함), 빌드 시점에 미리 굳히지 않고 항상
// 요청 시점에 렌더링한다.
export const dynamic = "force-dynamic";

export default async function Home() {
  let rumors: Awaited<ReturnType<typeof fetchLiveData>>["rumors"] = [];
  let journalists: Awaited<ReturnType<typeof fetchLiveData>>["journalists"] = [];
  let loadError: string | null = null;

  try {
    const data = await fetchLiveData();
    rumors = data.rumors;
    journalists = data.journalists;
  } catch (err) {
    loadError = (err as Error).message;
  }

  return <HomeClient rumors={rumors} journalists={journalists} loadError={loadError} />;
}
