'use client';

import { useState, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  label?: string;
}

export default function TagsInput({ 
  value = [], 
  onChange, 
  suggestions = [],
  label = 'Tags' 
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue.trim());
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  const addTag = (tag: string) => {
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const filteredSuggestions = suggestions.filter(
    (suggestion) =>
      !value.includes(suggestion) &&
      suggestion.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <Label className="text-amber-800 font-medium">{label}</Label>
      
      {/* Tags Display */}
      <div className="flex flex-wrap gap-2 p-2 bg-white/90 border border-amber-200 rounded-md min-h-[42px]">
        {value.map((tag, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="ml-1 hover:text-amber-900"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        
        {/* Input */}
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={value.length === 0 ? 'Type and press Enter to add tags' : ''}
          className="flex-1 min-w-[120px] border-0 focus:ring-0 focus-visible:ring-0 p-0 h-auto bg-transparent text-amber-800 placeholder:text-amber-400"
        />
      </div>

      {/* Suggestions */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="bg-white border border-amber-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => addTag(suggestion)}
              className="w-full text-left px-3 py-2 hover:bg-amber-50 text-amber-800 text-sm transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-amber-600">
        Press Enter to add a tag, or select from suggestions
      </p>
    </div>
  );
}
