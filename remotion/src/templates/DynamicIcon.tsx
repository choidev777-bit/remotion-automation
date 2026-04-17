import React from 'react';
import { DynamicIcon as LucideDynamicIcon, iconNames } from 'lucide-react/dynamic';

type LucideDynamicIconProps = React.ComponentProps<typeof LucideDynamicIcon>;

type Props = Omit<LucideDynamicIconProps, 'name'> & {
  name?: string;
  iconName?: string;
};

const validIconNames = new Set(iconNames);

export const DynamicIcon: React.FC<Props> = ({ name, iconName, ...props }) => {
  const resolvedName = name ?? iconName;

  if (!resolvedName || !validIconNames.has(resolvedName)) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[DynamicIcon] Unknown lucide icon: ${resolvedName ?? '(empty)'}`);
    }
    return null;
  }

  return <LucideDynamicIcon {...props} name={resolvedName} />;
};
