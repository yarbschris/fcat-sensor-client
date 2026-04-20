import {
  Language,
  LanguageContext,
  getLanguageName,
  useLanguage,
} from '@/LocalizationProvider';
import MoireLogo from '../../assets/moireLogo.svg';
import { Link } from 'react-router-dom';
import { Switch } from './switch';
import { Label } from './label';
import { useContext, useEffect, useState } from 'react';
import { decodeCombined } from '@/lib/utils';
import { Menu, X } from 'lucide-react';

export const Header = () => {
  const localizationContext = useContext(LanguageContext);
  const [buttons, setButtons] = useState<{ label: string; href: string }[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setButtons(getButtons(localizationContext.language));
  }, [localizationContext.language]);

  const getButtons = (language: Language) => [
    {
      label: decodeCombined('[en]Plots[es]Parcelas', language),
      href: '/',
    },
    {
      label: decodeCombined('[en]Nodes[es]Nodos', language),
      href: '/nodes',
    },
    {
      label: decodeCombined('[en]Sensors[es]Sensores', language),
      href: '/sensors',
    },
    {
      label: decodeCombined('[en]Settings[es]Ajustes', language),
      href: '/settings',
    },
  ];

  return (
    <div className="flex flex-row justify-between position-sticky top-0 bg-black text-white h-auto align-center shadow-lg">
      <img src={MoireLogo} alt="Moire Logo" className="h-16 mr-5 p-1 invert" />
      <div className="grow" />

      {/* Desktop nav */}
      <div className="hidden md:flex md:flex-row">
        {buttons.map((button, index) => (
          <Link
            key={button.label + index}
            to={button.href}
            className="btn btn-primary p-4 self-center h-auto hover:transform hover:scale-105 transition duration-100 ease-in-out hover:bg-black"
          >
            {button.label}
          </Link>
        ))}
      </div>
      <div className="hidden md:flex items-center space-x-2 pl-10 pr-3">
        <Switch
          id="enes"
          checked={localizationContext.language === 'es'}
          onClick={() =>
            localizationContext.setLanguage(
              localizationContext.language === 'es' ? 'en' : 'es',
            )
          }
        />
        <Label htmlFor="enes">{getLanguageName(localizationContext)}</Label>
      </div>
      <div className="hidden md:block w-5" />

      {/* Mobile hamburger */}
      <button
        className="md:hidden p-4 self-center"
        onClick={() => setMenuOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={28} />
      </button>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center gap-6 md:hidden">
          <button
            className="absolute top-4 right-4 p-2"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={28} />
          </button>
          {buttons.map((button, index) => (
            <Link
              key={button.label + index}
              to={button.href}
              className="text-white text-xl p-4 hover:opacity-75 transition"
              onClick={() => setMenuOpen(false)}
            >
              {button.label}
            </Link>
          ))}
          <div className="flex items-center space-x-2 mt-4">
            <Switch
              id="enes-mobile"
              checked={localizationContext.language === 'es'}
              onClick={() =>
                localizationContext.setLanguage(
                  localizationContext.language === 'es' ? 'en' : 'es',
                )
              }
            />
            <Label htmlFor="enes-mobile">{getLanguageName(localizationContext)}</Label>
          </div>
        </div>
      )}
    </div>
  );
};
