import React from 'react';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'bn', label: 'বাংলা' }
];

const LanguageSelector = ({ onSelect }) => {
  return (
    <div className="text-center">
      <h2 className="text-xl font-medium mb-4 text-gray-800">Please select your preferred language:</h2>
      <div className="flex flex-wrap justify-center gap-4">
        {languages.map(lang => (
          <button
            key={lang.code}
            onClick={() => onSelect(lang.code)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;