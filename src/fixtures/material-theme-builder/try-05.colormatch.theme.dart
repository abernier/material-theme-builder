import "package:flutter/material.dart";

class MaterialTheme {
  final TextTheme textTheme;

  const MaterialTheme(this.textTheme);

  static ColorScheme lightScheme() {
    return const ColorScheme(
      brightness: Brightness.light,
      primary: Color(0xffa501b3),
      surfaceTint: Color(0xffa501b3),
      onPrimary: Color(0xffffffff),
      primaryContainer: Color(0xfff766ff),
      onPrimaryContainer: Color(0xff680070),
      secondary: Color(0xff8a428d),
      onSecondary: Color(0xffffffff),
      secondaryContainer: Color(0xfffea9fc),
      onSecondaryContainer: Color(0xff7d3680),
      tertiary: Color(0xff326b00),
      onTertiary: Color(0xffffffff),
      tertiaryContainer: Color(0xff7bf600),
      onTertiaryContainer: Color(0xff336c00),
      error: Color(0xff130900),
      onError: Color(0xffffffff),
      errorContainer: Color(0xff311e00),
      onErrorContainer: Color(0xffa3845a),
      surface: Color(0xfffff7fa),
      onSurface: Color(0xff221821),
      onSurfaceVariant: Color(0xff414848),
      outline: Color(0xff717978),
      outlineVariant: Color(0xffc1c8c7),
      shadow: Color(0xff000000),
      scrim: Color(0xff000000),
      inverseSurface: Color(0xff382d37),
      inversePrimary: Color(0xffffa9fd),
      primaryFixed: Color(0xffffd6f9),
      onPrimaryFixed: Color(0xff37003c),
      primaryFixedDim: Color(0xffffa9fd),
      onPrimaryFixedVariant: Color(0xff7e0089),
      secondaryFixed: Color(0xffffd6f9),
      onSecondaryFixed: Color(0xff37003c),
      secondaryFixedDim: Color(0xfffea9fc),
      onSecondaryFixedVariant: Color(0xff6f2973),
      tertiaryFixed: Color(0xff83ff18),
      onTertiaryFixed: Color(0xff0b2000),
      tertiaryFixedDim: Color(0xff6fe000),
      onTertiaryFixedVariant: Color(0xff245100),
      surfaceDim: Color(0xffe7d5e2),
      surfaceBright: Color(0xfffff7fa),
      surfaceContainerLowest: Color(0xffffffff),
      surfaceContainerLow: Color(0xffffeff9),
      surfaceContainer: Color(0xfffbe9f6),
      surfaceContainerHigh: Color(0xfff5e3f0),
      surfaceContainerHighest: Color(0xfff0ddea),
    );
  }

  ThemeData light() {
    return theme(lightScheme());
  }

  static ColorScheme lightMediumContrastScheme() {
    return const ColorScheme(
      brightness: Brightness.light,
      primary: Color(0xff63006b),
      surfaceTint: Color(0xffa501b3),
      onPrimary: Color(0xffffffff),
      primaryContainer: Color(0xffb724c3),
      onPrimaryContainer: Color(0xffffffff),
      secondary: Color(0xff5c1661),
      onSecondary: Color(0xffffffff),
      secondaryContainer: Color(0xff9b519d),
      onSecondaryContainer: Color(0xffffffff),
      tertiary: Color(0xff1a3e00),
      onTertiary: Color(0xffffffff),
      tertiaryContainer: Color(0xff3b7c00),
      onTertiaryContainer: Color(0xffffffff),
      error: Color(0xff130900),
      onError: Color(0xffffffff),
      errorContainer: Color(0xff311e00),
      onErrorContainer: Color(0xffc9a87a),
      surface: Color(0xfffff7fa),
      onSurface: Color(0xff170e17),
      onSurfaceVariant: Color(0xff303837),
      outline: Color(0xff4c5453),
      outlineVariant: Color(0xff676e6e),
      shadow: Color(0xff000000),
      scrim: Color(0xff000000),
      inverseSurface: Color(0xff382d37),
      inversePrimary: Color(0xffffa9fd),
      primaryFixed: Color(0xffb724c3),
      onPrimaryFixed: Color(0xffffffff),
      primaryFixedDim: Color(0xff9500a2),
      onPrimaryFixedVariant: Color(0xffffffff),
      secondaryFixed: Color(0xff9b519d),
      onSecondaryFixed: Color(0xffffffff),
      secondaryFixedDim: Color(0xff7f3882),
      onSecondaryFixedVariant: Color(0xffffffff),
      tertiaryFixed: Color(0xff3b7c00),
      onTertiaryFixed: Color(0xffffffff),
      tertiaryFixedDim: Color(0xff2d6000),
      onTertiaryFixedVariant: Color(0xffffffff),
      surfaceDim: Color(0xffd3c2ce),
      surfaceBright: Color(0xfffff7fa),
      surfaceContainerLowest: Color(0xffffffff),
      surfaceContainerLow: Color(0xffffeff9),
      surfaceContainer: Color(0xfff5e3f0),
      surfaceContainerHigh: Color(0xffead8e5),
      surfaceContainerHighest: Color(0xffdecdd9),
    );
  }

  ThemeData lightMediumContrast() {
    return theme(lightMediumContrastScheme());
  }

  static ColorScheme lightHighContrastScheme() {
    return const ColorScheme(
      brightness: Brightness.light,
      primary: Color(0xff520059),
      surfaceTint: Color(0xffa501b3),
      onPrimary: Color(0xffffffff),
      primaryContainer: Color(0xff82008d),
      onPrimaryContainer: Color(0xffffffff),
      secondary: Color(0xff500756),
      onSecondary: Color(0xffffffff),
      secondaryContainer: Color(0xff722c76),
      onSecondaryContainer: Color(0xffffffff),
      tertiary: Color(0xff153300),
      onTertiary: Color(0xffffffff),
      tertiaryContainer: Color(0xff265300),
      onTertiaryContainer: Color(0xffffffff),
      error: Color(0xff130900),
      onError: Color(0xffffffff),
      errorContainer: Color(0xff311e00),
      onErrorContainer: Color(0xfff6d2a1),
      surface: Color(0xfffff7fa),
      onSurface: Color(0xff000000),
      onSurfaceVariant: Color(0xff000000),
      outline: Color(0xff262d2d),
      outlineVariant: Color(0xff434b4a),
      shadow: Color(0xff000000),
      scrim: Color(0xff000000),
      inverseSurface: Color(0xff382d37),
      inversePrimary: Color(0xffffa9fd),
      primaryFixed: Color(0xff82008d),
      onPrimaryFixed: Color(0xffffffff),
      primaryFixedDim: Color(0xff5d0065),
      onPrimaryFixedVariant: Color(0xffffffff),
      secondaryFixed: Color(0xff722c76),
      onSecondaryFixed: Color(0xffffffff),
      secondaryFixedDim: Color(0xff58115d),
      onSecondaryFixedVariant: Color(0xffffffff),
      tertiaryFixed: Color(0xff265300),
      onTertiaryFixed: Color(0xffffffff),
      tertiaryFixedDim: Color(0xff183a00),
      onTertiaryFixedVariant: Color(0xffffffff),
      surfaceDim: Color(0xffc5b4c0),
      surfaceBright: Color(0xfffff7fa),
      surfaceContainerLowest: Color(0xffffffff),
      surfaceContainerLow: Color(0xfffeebf9),
      surfaceContainer: Color(0xfff0ddea),
      surfaceContainerHigh: Color(0xffe1cfdc),
      surfaceContainerHighest: Color(0xffd3c2ce),
    );
  }

  ThemeData lightHighContrast() {
    return theme(lightHighContrastScheme());
  }

  static ColorScheme darkScheme() {
    return const ColorScheme(
      brightness: Brightness.dark,
      primary: Color(0xffffa9fd),
      surfaceTint: Color(0xffffa9fd),
      onPrimary: Color(0xff590061),
      primaryContainer: Color(0xfff766ff),
      onPrimaryContainer: Color(0xff680070),
      secondary: Color(0xfffea9fc),
      onSecondary: Color(0xff550e5a),
      secondaryContainer: Color(0xff6f2973),
      onSecondaryContainer: Color(0xffeb98ea),
      tertiary: Color(0xffe5ffcd),
      onTertiary: Color(0xff173800),
      tertiaryContainer: Color(0xff7bf600),
      onTertiaryContainer: Color(0xff336c00),
      error: Color(0xffe4c192),
      onError: Color(0xff422c09),
      errorContainer: Color(0xff311e00),
      onErrorContainer: Color(0xffa3845a),
      surface: Color(0xff1a1019),
      onSurface: Color(0xfff0ddea),
      onSurfaceVariant: Color(0xffc1c8c7),
      outline: Color(0xff8b9291),
      outlineVariant: Color(0xff414848),
      shadow: Color(0xff000000),
      scrim: Color(0xff000000),
      inverseSurface: Color(0xfff0ddea),
      inversePrimary: Color(0xffa501b3),
      primaryFixed: Color(0xffffd6f9),
      onPrimaryFixed: Color(0xff37003c),
      primaryFixedDim: Color(0xffffa9fd),
      onPrimaryFixedVariant: Color(0xff7e0089),
      secondaryFixed: Color(0xffffd6f9),
      onSecondaryFixed: Color(0xff37003c),
      secondaryFixedDim: Color(0xfffea9fc),
      onSecondaryFixedVariant: Color(0xff6f2973),
      tertiaryFixed: Color(0xff83ff18),
      onTertiaryFixed: Color(0xff0b2000),
      tertiaryFixedDim: Color(0xff6fe000),
      onTertiaryFixedVariant: Color(0xff245100),
      surfaceDim: Color(0xff1a1019),
      surfaceBright: Color(0xff413640),
      surfaceContainerLowest: Color(0xff140b14),
      surfaceContainerLow: Color(0xff221821),
      surfaceContainer: Color(0xff271c25),
      surfaceContainerHigh: Color(0xff312730),
      surfaceContainerHighest: Color(0xff3d313b),
    );
  }

  ThemeData dark() {
    return theme(darkScheme());
  }

  static ColorScheme darkMediumContrastScheme() {
    return const ColorScheme(
      brightness: Brightness.dark,
      primary: Color(0xffffcdfa),
      surfaceTint: Color(0xffffa9fd),
      onPrimary: Color(0xff47004e),
      primaryContainer: Color(0xfff766ff),
      onPrimaryContainer: Color(0xff300035),
      secondary: Color(0xffffcdfa),
      onSecondary: Color(0xff47004e),
      secondaryContainer: Color(0xffc374c3),
      onSecondaryContainer: Color(0xff000000),
      tertiary: Color(0xffe5ffcd),
      onTertiary: Color(0xff173800),
      tertiaryContainer: Color(0xff7bf600),
      onTertiaryContainer: Color(0xff224d00),
      error: Color(0xfffbd7a6),
      onError: Color(0xff352202),
      errorContainer: Color(0xffab8c60),
      onErrorContainer: Color(0xff000000),
      surface: Color(0xff1a1019),
      onSurface: Color(0xffffffff),
      onSurfaceVariant: Color(0xffd6dedd),
      outline: Color(0xffacb3b2),
      outlineVariant: Color(0xff8a9291),
      shadow: Color(0xff000000),
      scrim: Color(0xff000000),
      inverseSurface: Color(0xfff0ddea),
      inversePrimary: Color(0xff80008b),
      primaryFixed: Color(0xffffd6f9),
      onPrimaryFixed: Color(0xff250029),
      primaryFixedDim: Color(0xffffa9fd),
      onPrimaryFixedVariant: Color(0xff63006b),
      secondaryFixed: Color(0xffffd6f9),
      onSecondaryFixed: Color(0xff250029),
      secondaryFixedDim: Color(0xfffea9fc),
      onSecondaryFixedVariant: Color(0xff5c1661),
      tertiaryFixed: Color(0xff83ff18),
      onTertiaryFixed: Color(0xff051500),
      tertiaryFixedDim: Color(0xff6fe000),
      onTertiaryFixedVariant: Color(0xff1a3e00),
      surfaceDim: Color(0xff1a1019),
      surfaceBright: Color(0xff4d414b),
      surfaceContainerLowest: Color(0xff0d050c),
      surfaceContainerLow: Color(0xff241a23),
      surfaceContainer: Color(0xff2f252e),
      surfaceContainerHigh: Color(0xff3a2f39),
      surfaceContainerHighest: Color(0xff463a44),
    );
  }

  ThemeData darkMediumContrast() {
    return theme(darkMediumContrastScheme());
  }

  static ColorScheme darkHighContrastScheme() {
    return const ColorScheme(
      brightness: Brightness.dark,
      primary: Color(0xffffeaf9),
      surfaceTint: Color(0xffffa9fd),
      onPrimary: Color(0xff000000),
      primaryContainer: Color(0xffffa2fe),
      onPrimaryContainer: Color(0xff1c001f),
      secondary: Color(0xffffeaf9),
      onSecondary: Color(0xff000000),
      secondaryContainer: Color(0xfffaa5f8),
      onSecondaryContainer: Color(0xff1c001f),
      tertiary: Color(0xffe5ffcd),
      onTertiary: Color(0xff000000),
      tertiaryContainer: Color(0xff7bf600),
      onTertiaryContainer: Color(0xff102a00),
      error: Color(0xffffedd9),
      onError: Color(0xff000000),
      errorContainer: Color(0xffe0bd8e),
      onErrorContainer: Color(0xff130900),
      surface: Color(0xff1a1019),
      onSurface: Color(0xffffffff),
      onSurfaceVariant: Color(0xffffffff),
      outline: Color(0xffeaf1f0),
      outlineVariant: Color(0xffbdc4c3),
      shadow: Color(0xff000000),
      scrim: Color(0xff000000),
      inverseSurface: Color(0xfff0ddea),
      inversePrimary: Color(0xff80008b),
      primaryFixed: Color(0xffffd6f9),
      onPrimaryFixed: Color(0xff000000),
      primaryFixedDim: Color(0xffffa9fd),
      onPrimaryFixedVariant: Color(0xff250029),
      secondaryFixed: Color(0xffffd6f9),
      onSecondaryFixed: Color(0xff000000),
      secondaryFixedDim: Color(0xfffea9fc),
      onSecondaryFixedVariant: Color(0xff250029),
      tertiaryFixed: Color(0xff83ff18),
      onTertiaryFixed: Color(0xff000000),
      tertiaryFixedDim: Color(0xff6fe000),
      onTertiaryFixedVariant: Color(0xff051500),
      surfaceDim: Color(0xff1a1019),
      surfaceBright: Color(0xff594c57),
      surfaceContainerLowest: Color(0xff000000),
      surfaceContainerLow: Color(0xff271c25),
      surfaceContainer: Color(0xff382d37),
      surfaceContainerHigh: Color(0xff433842),
      surfaceContainerHighest: Color(0xff4f434d),
    );
  }

  ThemeData darkHighContrast() {
    return theme(darkHighContrastScheme());
  }


  ThemeData theme(ColorScheme colorScheme) => ThemeData(
     useMaterial3: true,
     brightness: colorScheme.brightness,
     colorScheme: colorScheme,
     textTheme: textTheme.apply(
       bodyColor: colorScheme.onSurface,
       displayColor: colorScheme.onSurface,
     ),
     scaffoldBackgroundColor: colorScheme.background,
     canvasColor: colorScheme.surface,
  );

  /// Custom Color 1
  static const customColor1 = ExtendedColor(
    seed: Color(0xfff69c83),
    value: Color(0xfff69a99),
    light: ColorFamily(
      color: Color(0xff924849),
      onColor: Color(0xffffffff),
      colorContainer: Color(0xfff69a99),
      onColorContainer: Color(0xff733031),
    ),
    lightMediumContrast: ColorFamily(
      color: Color(0xff924849),
      onColor: Color(0xffffffff),
      colorContainer: Color(0xfff69a99),
      onColorContainer: Color(0xff733031),
    ),
    lightHighContrast: ColorFamily(
      color: Color(0xff924849),
      onColor: Color(0xffffffff),
      colorContainer: Color(0xfff69a99),
      onColorContainer: Color(0xff733031),
    ),
    dark: ColorFamily(
      color: Color(0xffffbebd),
      onColor: Color(0xff581c1e),
      colorContainer: Color(0xfff69a99),
      onColorContainer: Color(0xff733031),
    ),
    darkMediumContrast: ColorFamily(
      color: Color(0xffffbebd),
      onColor: Color(0xff581c1e),
      colorContainer: Color(0xfff69a99),
      onColorContainer: Color(0xff733031),
    ),
    darkHighContrast: ColorFamily(
      color: Color(0xffffbebd),
      onColor: Color(0xff581c1e),
      colorContainer: Color(0xfff69a99),
      onColorContainer: Color(0xff733031),
    ),
  );

  /// Custom Color 2
  static const customColor2 = ExtendedColor(
    seed: Color(0xff8dccf8),
    value: Color(0xff8dccf8),
    light: ColorFamily(
      color: Color(0xff19648b),
      onColor: Color(0xffffffff),
      colorContainer: Color(0xff8dccf8),
      onColorContainer: Color(0xff00577d),
    ),
    lightMediumContrast: ColorFamily(
      color: Color(0xff19648b),
      onColor: Color(0xffffffff),
      colorContainer: Color(0xff8dccf8),
      onColorContainer: Color(0xff00577d),
    ),
    lightHighContrast: ColorFamily(
      color: Color(0xff19648b),
      onColor: Color(0xffffffff),
      colorContainer: Color(0xff8dccf8),
      onColorContainer: Color(0xff00577d),
    ),
    dark: ColorFamily(
      color: Color(0xffc4e5ff),
      onColor: Color(0xff00344d),
      colorContainer: Color(0xff8dccf8),
      onColorContainer: Color(0xff00577d),
    ),
    darkMediumContrast: ColorFamily(
      color: Color(0xffc4e5ff),
      onColor: Color(0xff00344d),
      colorContainer: Color(0xff8dccf8),
      onColorContainer: Color(0xff00577d),
    ),
    darkHighContrast: ColorFamily(
      color: Color(0xffc4e5ff),
      onColor: Color(0xff00344d),
      colorContainer: Color(0xff8dccf8),
      onColorContainer: Color(0xff00577d),
    ),
  );


  List<ExtendedColor> get extendedColors => [
    customColor1,
    customColor2,
  ];
}

class ExtendedColor {
  final Color seed, value;
  final ColorFamily light;
  final ColorFamily lightHighContrast;
  final ColorFamily lightMediumContrast;
  final ColorFamily dark;
  final ColorFamily darkHighContrast;
  final ColorFamily darkMediumContrast;

  const ExtendedColor({
    required this.seed,
    required this.value,
    required this.light,
    required this.lightHighContrast,
    required this.lightMediumContrast,
    required this.dark,
    required this.darkHighContrast,
    required this.darkMediumContrast,
  });
}

class ColorFamily {
  const ColorFamily({
    required this.color,
    required this.onColor,
    required this.colorContainer,
    required this.onColorContainer,
  });

  final Color color;
  final Color onColor;
  final Color colorContainer;
  final Color onColorContainer;
}
