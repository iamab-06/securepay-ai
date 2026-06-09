import React from 'react';

export default function PlaceholderPage({ title }) {
  return (
    <div className="flex items-center justify-center h-[80vh]">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">{title}</h2>
        <p className="text-muted-foreground">This section will be built in the next phase.</p>
      </div>
    </div>
  );
}
