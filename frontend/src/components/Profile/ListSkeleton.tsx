import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface ListSkeletonProps {
  count: number;
}

const ListSkeleton = ({ count }: ListSkeletonProps) => (
  <ul>
    {Array(count).fill(0).map((_, idx) => (
      <li key={idx} className="p-2 mb-2 bg-gray-200 rounded">
        <Skeleton height={20} />
      </li>
    ))}
  </ul>
);

export default ListSkeleton;
