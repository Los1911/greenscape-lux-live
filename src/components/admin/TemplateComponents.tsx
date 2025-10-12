import React from 'react';
import { useDrag } from 'react-dnd';
import { Type, Image, Button as ButtonIcon, Layout, Mail } from 'lucide-react';

export interface TemplateComponent {
  id: string;
  type: 'header' | 'text' | 'button' | 'image' | 'spacer';
  content: string;
  styles: Record<string, any>;
}

const componentTypes = [
  { type: 'header', icon: Type, label: 'Header', defaultContent: 'Header Text' },
  { type: 'text', icon: Mail, label: 'Text Block', defaultContent: 'Your text content here...' },
  { type: 'button', icon: ButtonIcon, label: 'Button', defaultContent: 'Click Here' },
  { type: 'image', icon: Image, label: 'Image', defaultContent: 'https://via.placeholder.com/400x200' },
  { type: 'spacer', icon: Layout, label: 'Spacer', defaultContent: '' }
];

interface DraggableComponentProps {
  type: string;
  icon: React.ComponentType<any>;
  label: string;
  defaultContent: string;
}

function DraggableComponent({ type, icon: Icon, label, defaultContent }: DraggableComponentProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'template-component',
    item: { type, defaultContent },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`p-3 bg-white border rounded-lg cursor-move hover:shadow-md transition-all ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center space-x-2">
        <Icon className="h-4 w-4 text-gray-600" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  );
}

export default function TemplateComponents() {
  return (
    <div className="p-4 bg-gray-50 border-r">
      <h3 className="font-semibold mb-4">Components</h3>
      <div className="space-y-2">
        {componentTypes.map(({ type, icon, label, defaultContent }) => (
          <DraggableComponent
            key={type}
            type={type}
            icon={icon}
            label={label}
            defaultContent={defaultContent}
          />
        ))}
      </div>
    </div>
  );
}