import { Card } from '@tremor/react';

export function CardHero({cls, lcp, fcp}) {
    return (
      <Card className="mx-auto max-w-xs">
        <div>{cls}</div>
        <div>{lcp}</div>
        <div>{fcp}</div>
      </Card>
    );
}

