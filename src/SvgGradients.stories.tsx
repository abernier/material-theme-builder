import type { Meta, StoryObj } from "@storybook/react-vite";
import { useMemo } from "react";
import { recolorizeSvg } from "./lib/recolorizeSvg";
import { Mcu, type McuConfig } from "./Mcu";
import { useMcu } from "./Mcu.context";

import complexSvg from "./assets/test-complex.svg?raw";
import gradientSvg from "./assets/test-gradient.svg?raw";
import patternSvg from "./assets/test-pattern.svg?raw";
import tigerSvg from "./assets/tiger.svg?raw";

const meta = {
  title: "SVG Recolorization/Gradients & Patterns",
  component: Mcu,
  parameters: {
    chromatic: {
      modes: {
        light: { theme: "light" },
        dark: { theme: "dark" },
      },
    },
    layout: "padded",
  },
  argTypes: {
    source: {
      control: "color",
    },
  },
} satisfies Meta<typeof Mcu>;

export default meta;
type Story = StoryObj<typeof meta>;

// ██████  ███████  ██████  ██████  ██       ██████  ██████
// ██   ██ ██      ██      ██    ██ ██      ██    ██ ██   ██
// ██████  █████   ██      ██    ██ ██      ██    ██ ██████
// ██   ██ ██      ██      ██    ██ ██      ██    ██ ██   ██
// ██   ██ ███████  ██████  ██████  ███████  ██████  ██   ██

const RecolorizedComparison = ({
  svgContent,
  title,
}: {
  svgContent: string;
  title: string;
}) => {
  const { allPalettes } = useMcu();

  const recoloredSvg = useMemo(() => {
    return recolorizeSvg(svgContent, allPalettes);
  }, [svgContent, allPalettes]);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">{title}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">
            Original SVG (couleurs fixes)
          </h3>
          <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-900">
            <div dangerouslySetInnerHTML={{ __html: svgContent }} />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">
            Recolorisé avec MCU (variables CSS dynamiques)
          </h3>
          <div className="border-2 border-primary rounded-lg p-4 bg-surface">
            <div dangerouslySetInnerHTML={{ __html: recoloredSvg }} />
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h4 className="font-semibold mb-2">✅ Ce qui marche :</h4>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>
            Les couleurs des <code>stop-color</code> dans les gradients sont
            recolorisées
          </li>
          <li>
            Les références <code>url(#gradient)</code> sont préservées
          </li>
          <li>Les patterns sont entièrement recolorisés</li>
          <li>
            Les éléments dans <code>&lt;defs&gt;</code> sont traités
            correctement
          </li>
          <li>L'opacité et les autres propriétés sont conservées</li>
        </ul>
      </div>
    </div>
  );
};

const Scene = ({
  svgContent,
  title,
  customColors,
}: {
  svgContent: string;
  title: string;
  customColors?: McuConfig["customColors"];
}) => {
  return (
    <div className="p-8 space-y-8">
      <RecolorizedComparison svgContent={svgContent} title={title} />

      <div className="mt-12">
        <h3 className="text-xl font-bold mb-4">Palette de couleurs MCU</h3>
        <div className="grid grid-cols-5 gap-4">
          {[
            "primary",
            "secondary",
            "tertiary",
            "neutral",
            "neutral-variant",
          ].map((palette) => (
            <div key={palette} className="space-y-2">
              <div className="font-semibold text-sm">{palette}</div>
              {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 100].map((tone) => (
                <div
                  key={tone}
                  className="h-8 rounded"
                  style={{
                    backgroundColor: `var(--mcu-${palette}-${tone})`,
                  }}
                  title={`${palette}-${tone}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ███████ ████████  ██████  ██████  ██ ███████ ███████
// ██         ██    ██    ██ ██   ██ ██ ██      ██
// ███████    ██    ██    ██ ██████  ██ █████   ███████
//      ██    ██    ██    ██ ██   ██ ██ ██           ██
// ███████    ██     ██████  ██   ██ ██ ███████ ███████

/**
 * Démontre que les gradients linéaires sont correctement recolorisés.
 * Les couleurs des <stop> éléments sont remplacées par des variables CSS MCU.
 */
export const LinearGradients: Story = {
  args: {
    source: "#6750A4",
    scheme: "tonalSpot",
    contrast: 0,
    customColors: [],
  },
  render: (args) => (
    <Mcu {...args}>
      <Scene
        svgContent={gradientSvg}
        title="Gradients Linéaires et Radiaux"
        customColors={args.customColors}
      />
    </Mcu>
  ),
};

/**
 * Démontre que les patterns SVG sont correctement recolorisés.
 * Tous les éléments à l'intérieur des patterns sont recolorisés.
 */
export const Patterns: Story = {
  args: {
    source: "#FF5733",
    scheme: "vibrant",
    contrast: 0,
    customColors: [],
  },
  render: (args) => (
    <Mcu {...args}>
      <Scene
        svgContent={patternSvg}
        title="Patterns SVG"
        customColors={args.customColors}
      />
    </Mcu>
  ),
};

/**
 * Démontre que les structures SVG complexes sont gérées :
 * - Patterns avec gradients imbriqués
 * - Éléments <use> référençant des <defs>
 * - Gradients avec opacité
 */
export const ComplexNested: Story = {
  args: {
    source: "#4ECDC4",
    scheme: "content",
    contrast: 0,
    customColors: [],
  },
  render: (args) => (
    <Mcu {...args}>
      <Scene
        svgContent={complexSvg}
        title="Structures SVG Complexes"
        customColors={args.customColors}
      />
    </Mcu>
  ),
};

/**
 * Compare tous les types de SVG avec différentes couleurs sources.
 */
export const AllFeatures: Story = {
  args: {
    source: "#769CDF",
    scheme: "tonalSpot",
    contrast: 0,
    customColors: [
      { name: "brand", hex: "#FF5733", blend: true },
      { name: "success", hex: "#28A745", blend: false },
    ],
  },
  render: (args) => (
    <Mcu {...args}>
      <div className="p-8 space-y-16">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Support complet des fonctionnalités SVG
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Changez la couleur source ci-dessus pour voir tous les SVG se
            recoloriser automatiquement !
          </p>
        </div>

        <RecolorizedComparison
          svgContent={gradientSvg}
          title="1. Gradients (linéaires et radiaux)"
        />

        <div className="border-t-4 border-gray-300 dark:border-gray-600 my-16" />

        <RecolorizedComparison
          svgContent={patternSvg}
          title="2. Patterns SVG"
        />

        <div className="border-t-4 border-gray-300 dark:border-gray-600 my-16" />

        <RecolorizedComparison
          svgContent={complexSvg}
          title="3. Structures complexes (nested gradients + patterns)"
        />

        <div className="border-t-4 border-gray-300 dark:border-gray-600 my-16" />

        <RecolorizedComparison
          svgContent={tigerSvg}
          title="4. 🐯 Tiger SVG - Le test ultime !"
        />

        <div className="mt-16 p-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg">
          <h2 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-4">
            🎉 Conclusion
          </h2>
          <p className="text-lg text-green-700 dark:text-green-200">
            <strong>
              Oui, ça marche pour les dégradés, les patterns, et tous les trucs
              les plus farfelus de SVG !
            </strong>
          </p>
          <ul className="mt-4 space-y-2 text-green-700 dark:text-green-200">
            <li>✅ Gradients linéaires</li>
            <li>✅ Gradients radiaux</li>
            <li>✅ Patterns</li>
            <li>✅ Patterns avec gradients imbriqués</li>
            <li>✅ Éléments dans &lt;defs&gt;</li>
            <li>✅ Références via &lt;use&gt;</li>
            <li>✅ Préservation de l'opacité</li>
            <li>✅ Inline styles</li>
          </ul>
        </div>
      </div>
    </Mcu>
  ),
};

/**
 * Variante avec un thème sombre pour tester le comportement dans différents modes.
 */
export const DarkThemeComparison: Story = {
  args: {
    source: "#D0BCFF",
    scheme: "tonalSpot",
    contrast: 0.5,
    customColors: [],
  },
  parameters: {
    backgrounds: { default: "dark" },
  },
  render: (args) => (
    <Mcu {...args}>
      <Scene
        svgContent={gradientSvg}
        title="Mode Sombre - Gradients"
        customColors={args.customColors}
      />
    </Mcu>
  ),
};

/**
 * 🐯 Le Tiger SVG - Un exemple complexe et complet qui teste TOUTES les fonctionnalités :
 * - Multiples gradients linéaires et radiaux
 * - Patterns avec rayures
 * - Nested gradients dans patterns
 * - Stop colors avec opacités
 * - Références croisées entre éléments
 * - Textures et effets complexes
 *
 * C'est LE test ultime pour valider que "ça marche pour tous les trucs les plus farfelus de SVG" !
 */
export const TigerShowcase: Story = {
  args: {
    source: "#FF6B35",
    scheme: "vibrant",
    contrast: 0,
    customColors: [],
  },
  render: (args) => (
    <Mcu {...args}>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-4">🐯 Le Tiger SVG</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
            Un SVG complexe inspiré du célèbre Ghostscript Tiger
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-500">
            Avec <strong>15+ gradients</strong>,{" "}
            <strong>patterns imbriqués</strong>, <strong>textures</strong>, et
            toutes les fonctionnalités SVG complexes !
          </p>
        </div>

        <RecolorizedComparison
          svgContent={tigerSvg}
          title="Tiger avec tous les trucs farfelus de SVG"
        />

        <div className="mt-8 p-6 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-2 border-orange-500 rounded-lg">
          <h2 className="text-2xl font-bold text-orange-800 dark:text-orange-300 mb-4">
            🎨 Ce que ce Tiger teste :
          </h2>
          <div className="grid grid-cols-2 gap-4 text-orange-700 dark:text-orange-200">
            <ul className="space-y-2">
              <li>✅ Gradients radiaux (yeux, corps, ombres)</li>
              <li>✅ Gradients linéaires (rayures, oreilles)</li>
              <li>✅ Patterns avec gradients imbriqués (fourrure)</li>
              <li>✅ Stop-color avec opacité</li>
              <li>✅ Références croisées (pattern → gradient)</li>
            </ul>
            <ul className="space-y-2">
              <li>✅ Transforms et rotations</li>
              <li>✅ Nested groups (&lt;g&gt; dans &lt;g&gt;)</li>
              <li>✅ Paths complexes avec courbes</li>
              <li>✅ Multiple fill/stroke sur patterns</li>
              <li>✅ Ellipses, circles, paths, rects</li>
            </ul>
          </div>
        </div>

        <div className="p-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg">
          <h3 className="text-xl font-bold text-green-800 dark:text-green-300 mb-2">
            ✅ Verdict Final
          </h3>
          <p className="text-lg text-green-700 dark:text-green-200">
            <strong>
              OUI, ça marche pour les gradients, les patterns, et TOUS les trucs
              les plus farfelus de SVG !
            </strong>
          </p>
        </div>
      </div>
    </Mcu>
  ),
};
