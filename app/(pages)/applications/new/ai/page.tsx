import {
  createAiApplication,
  extractAiApplication,
} from '@/app/actions/applications';
import { AiData } from '@/lib/types';

export default async function Ai() {
  const url =
    'https://www.linkedin.com/jobs/view/4158259407/?alternateChannel=search&refId=vuH3Os55P1Q%2Bf3zd9XKNhw%3D%3D&trackingId=mW9NZnFPjrezitM7aJbZ1Q%3D%3D';

  const data: AiData = await extractAiApplication(url);

  if (data?.status === 'fail') {
    return;
  }
  const application = await createAiApplication(data.application!);

  console.log(application);

  return <div>Placeholder</div>;
}
