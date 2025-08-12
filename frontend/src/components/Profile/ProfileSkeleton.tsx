import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const ProfileSkeleton = () => (
  <div className="pb-4 mb-4 border-b">
    <Skeleton height={25} width={200} />
    <Skeleton height={20} width={250} className="mt-2" />
    <Skeleton height={20} width={300} className="mt-2" />
  </div>
);

export default ProfileSkeleton;
