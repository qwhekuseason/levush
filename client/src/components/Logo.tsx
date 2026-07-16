import { Link } from 'react-router-dom';
import { classNames } from '@/lib/format';

interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps) {
  return (
    <Link to="/" className={classNames('group inline-flex items-center', className)} aria-label="Levush home">
      <img src="/levush-logo.png" alt="Levush" className="h-14 object-contain mix-blend-multiply" />
    </Link>
  );
}
