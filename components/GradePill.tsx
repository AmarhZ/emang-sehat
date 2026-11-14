import { GRADES } from '@/lib/grading';
export default function GradePill({ g }: { g: number }) {
  return <span className={`pill g${GRADES[g]}`}>{GRADES[g]}</span>;
}
