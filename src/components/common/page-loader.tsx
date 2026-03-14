import React from 'react';

export const PageLoader: React.FC = () => (
    <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
);
