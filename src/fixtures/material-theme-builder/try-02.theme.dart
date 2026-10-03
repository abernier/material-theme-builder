import "package:flutter/material.dart";

class MaterialTheme {
  final TextTheme textTheme;

  const MaterialTheme(this.textTheme);

  static ColorScheme lightScheme() {
    return const ColorScheme(
      brightness: Brightness.light,
      primary: Color(0xff6c5e10),
      surfaceTint: Color(0xff6c5e10),
      onPrimary: Color(0xffffffff),
      primaryContainer: Color(0xfff6e388),
      onPrimaryContainer: Color(0xff524600),
      secondary: Color(0xff904a47),
      onSecondary: Color(0xffffffff),
      secondaryContainer: Color(0xffffdad7),
      onSecondaryContainer: Color(0xff733331),
      tertiary: Color(0xff535a92),
      onTertiary: Color(0xffffffff),
      tertiaryContainer: Color(0xffdfe0ff),
      onTertiaryContainer: Color(0xff3b4279),
      error: Color(0xff47672f),
      onError: Color(0xffffffff),
      errorContainer: Color(0xffc8eea8),
      onErrorContainer: Color(0xff304f1a),
      surface: Color(0xfffdf8ff),
      onSurface: Color(0xff1c1b20),
      onSurfaceVariant: Color(0xff43474e),
      outline: Color(0xff73777f),
      outlineVariant: Color(0xffc3c6cf),
      shadow: Color(0xff000000),
      scrim: Color(0xff000000),
      inverseSurface: Color(0xff312f36),
      inversePrimary: Color(0xffd9c76f),
      primaryFixed: Color(0xfff6e388),
      onPrimaryFixed: Color(0xff211b00),
      primaryFixedDim: Color(0xffd9c76f),
      onPrimaryFixedVariant: Color(0xff524600),
      secondaryFixed: Color(0xffffdad7),
      onSecondaryFixed: Color(0xff3b080a),
      secondaryFixedDim: Color(0xffffb3af),
      onSecondaryFixedVariant: Color(0xff733331),
      tertiaryFixed: Color(0xffdfe0ff),
      onTertiaryFixed: Color(0xff0d154b),
      tertiaryFixedDim: Color(0xffbcc2ff),
      onTertiaryFixedVariant: Color(0xff3b4279),
      surfaceDim: Color(0xffddd8e0),
      surfaceBright: Color(0xfffdf8ff),
      surfaceContainerLowest: Color(0xffffffff),
      surfaceContainerLow: Color(0xfff7f2fa),
      surfaceContainer: Color(0xfff1ecf4),
      surfaceContainerHigh: Color(0xffebe6ee),
      surfaceContainerHighest: Color(0xffe6e1e9),
    );
  }

  ThemeData light() {
    return theme(lightScheme());
  }

  static ColorScheme lightMediumContrastScheme() {
    return const ColorScheme(
      brightness: Brightness.light,
      primary: Color(0xff3f3600),
      surfaceTint: Color(0xff6c5e10),
      onPrimary: Color(0xffffffff),
      primaryContainer: Color(0xff7b6d1f),
      onPrimaryContainer: Color(0xffffffff),
      secondary: Color(0xff5e2322),
      onSecondary: Color(0xffffffff),
      secondaryContainer: Color(0xffa15855),
      onSecondaryContainer: Color(0xffffffff),
      tertiary: Color(0xff2a3167),
      onTertiary: Color(0xffffffff),
      tertiaryContainer: Color(0xff6269a2),
      onTertiaryContainer: Color(0xffffffff),
      error: Color(0xff203d0a),
      onError: Color(0xffffffff),
      errorContainer: Color(0xff55763d),
      onErrorContainer: Color(0xffffffff),
      surface: Color(0xfffdf8ff),
      onSurface: Color(0xff121016),
      onSurfaceVariant: Color(0xff32363d),
      outline: Color(0xff4f535a),
      outlineVariant: Color(0xff696d75),
      shadow: Color(0xff000000),
      scrim: Color(0xff000000),
      inverseSurface: Color(0xff312f36),
      inversePrimary: Color(0xffd9c76f),
      primaryFixed: Color(0xff7b6d1f),
      onPrimaryFixed: Color(0xffffffff),
      primaryFixedDim: Color(0xff625404),
      onPrimaryFixedVariant: Color(0xffffffff),
      secondaryFixed: Color(0xffa15855),
      onSecondaryFixed: Color(0xffffffff),
      secondaryFixedDim: Color(0xff84413e),
      onSecondaryFixedVariant: Color(0xffffffff),
      tertiaryFixed: Color(0xff6269a2),
      onTertiaryFixed: Color(0xffffffff),
      tertiaryFixedDim: Color(0xff495088),
      onTertiaryFixedVariant: Color(0xffffffff),
      surfaceDim: Color(0xffc9c5cd),
      surfaceBright: Color(0xfffdf8ff),
      surfaceContainerLowest: Color(0xffffffff),
      surfaceContainerLow: Color(0xfff7f2fa),
      surfaceContainer: Color(0xffebe6ee),
      surfaceContainerHigh: Color(0xffe0dbe3),
      surfaceContainerHighest: Color(0xffd5d0d8),
    );
  }

  ThemeData lightMediumContrast() {
    return theme(lightMediumContrastScheme());
  }

  static ColorScheme lightHighContrastScheme() {
    return const ColorScheme(
      brightness: Brightness.light,
      primary: Color(0xff342c00),
      surfaceTint: Color(0xff6c5e10),
      onPrimary: Color(0xffffffff),
      primaryContainer: Color(0xff554900),
      onPrimaryContainer: Color(0xffffffff),
      secondary: Color(0xff511919),
      onSecondary: Color(0xffffffff),
      secondaryContainer: Color(0xff763533),
      onSecondaryContainer: Color(0xffffffff),
      tertiary: Color(0xff20275c),
      onTertiary: Color(0xffffffff),
      tertiaryContainer: Color(0xff3e457b),
      onTertiaryContainer: Color(0xffffffff),
      error: Color(0xff163302),
      onError: Color(0xffffffff),
      errorContainer: Color(0xff32511c),
      onErrorContainer: Color(0xffffffff),
      surface: Color(0xfffdf8ff),
      onSurface: Color(0xff000000),
      onSurfaceVariant: Color(0xff000000),
      outline: Color(0xff282c33),
      outlineVariant: Color(0xff454951),
      shadow: Color(0xff000000),
      scrim: Color(0xff000000),
      inverseSurface: Color(0xff312f36),
      inversePrimary: Color(0xffd9c76f),
      primaryFixed: Color(0xff554900),
      onPrimaryFixed: Color(0xffffffff),
      primaryFixedDim: Color(0xff3b3200),
      onPrimaryFixedVariant: Color(0xffffffff),
      secondaryFixed: Color(0xff763533),
      onSecondaryFixed: Color(0xffffffff),
      secondaryFixedDim: Color(0xff59201f),
      onSecondaryFixedVariant: Color(0xffffffff),
      tertiaryFixed: Color(0xff3e457b),
      onTertiaryFixed: Color(0xffffffff),
      tertiaryFixedDim: Color(0xff262e63),
      onTertiaryFixedVariant: Color(0xffffffff),
      surfaceDim: Color(0xffbbb7bf),
      surfaceBright: Color(0xfffdf8ff),
      surfaceContainerLowest: Color(0xffffffff),
      surfaceContainerLow: Color(0xfff4eff7),
      surfaceContainer: Color(0xffe6e1e9),
      surfaceContainerHigh: Color(0xffd7d3db),
      surfaceContainerHighest: Color(0xffc9c5cd),
    );
  }

  ThemeData lightHighContrast() {
    return theme(lightHighContrastScheme());
  }

  static ColorScheme darkScheme() {
    return const ColorScheme(
      brightness: Brightness.dark,
      primary: Color(0xffd9c76f),
      surfaceTint: Color(0xffd9c76f),
      onPrimary: Color(0xff393000),
      primaryContainer: Color(0xff524600),
      onPrimaryContainer: Color(0xfff6e388),
      secondary: Color(0xffffb3af),
      onSecondary: Color(0xff571d1c),
      secondaryContainer: Color(0xff733331),
      onSecondaryContainer: Color(0xffffdad7),
      tertiary: Color(0xffbcc2ff),
      onTertiary: Color(0xff242b61),
      tertiaryContainer: Color(0xff3b4279),
      onTertiaryContainer: Color(0xffdfe0ff),
      error: Color(0xffacd28e),
      onError: Color(0xff1a3705),
      errorContainer: Color(0xff304f1a),
      onErrorContainer: Color(0xffc8eea8),
      surface: Color(0xff141318),
      onSurface: Color(0xffe6e1e9),
      onSurfaceVariant: Color(0xffc3c6cf),
      outline: Color(0xff8d9199),
      outlineVariant: Color(0xff43474e),
      shadow: Color(0xff000000),
      scrim: Color(0xff000000),
      inverseSurface: Color(0xffe6e1e9),
      inversePrimary: Color(0xff6c5e10),
      primaryFixed: Color(0xfff6e388),
      onPrimaryFixed: Color(0xff211b00),
      primaryFixedDim: Color(0xffd9c76f),
      onPrimaryFixedVariant: Color(0xff524600),
      secondaryFixed: Color(0xffffdad7),
      onSecondaryFixed: Color(0xff3b080a),
      secondaryFixedDim: Color(0xffffb3af),
      onSecondaryFixedVariant: Color(0xff733331),
      tertiaryFixed: Color(0xffdfe0ff),
      onTertiaryFixed: Color(0xff0d154b),
      tertiaryFixedDim: Color(0xffbcc2ff),
      onTertiaryFixedVariant: Color(0xff3b4279),
      surfaceDim: Color(0xff141318),
      surfaceBright: Color(0xff3a383e),
      surfaceContainerLowest: Color(0xff0f0d13),
      surfaceContainerLow: Color(0xff1c1b20),
      surfaceContainer: Color(0xff201f24),
      surfaceContainerHigh: Color(0xff2b292f),
      surfaceContainerHighest: Color(0xff36343a),
    );
  }

  ThemeData dark() {
    return theme(darkScheme());
  }

  static ColorScheme darkMediumContrastScheme() {
    return const ColorScheme(
      brightness: Brightness.dark,
      primary: Color(0xfff0dd83),
      surfaceTint: Color(0xffd9c76f),
      onPrimary: Color(0xff2c2500),
      primaryContainer: Color(0xffa1913f),
      onPrimaryContainer: Color(0xff000000),
      secondary: Color(0xffffd2ce),
      onSecondary: Color(0xff481313),
      secondaryContainer: Color(0xffcb7b76),
      onSecondaryContainer: Color(0xff000000),
      tertiary: Color(0xffd7daff),
      onTertiary: Color(0xff192055),
      tertiaryContainer: Color(0xff858dc8),
      onTertiaryContainer: Color(0xff000000),
      error: Color(0xffc2e8a2),
      onError: Color(0xff112c00),
      errorContainer: Color(0xff789b5d),
      onErrorContainer: Color(0xff000000),
      surface: Color(0xff141318),
      onSurface: Color(0xffffffff),
      onSurfaceVariant: Color(0xffd9dce5),
      outline: Color(0xffafb2bb),
      outlineVariant: Color(0xff8d9099),
      shadow: Color(0xff000000),
      scrim: Color(0xff000000),
      inverseSurface: Color(0xffe6e1e9),
      inversePrimary: Color(0xff534800),
      primaryFixed: Color(0xfff6e388),
      onPrimaryFixed: Color(0xff151100),
      primaryFixedDim: Color(0xffd9c76f),
      onPrimaryFixedVariant: Color(0xff3f3600),
      secondaryFixed: Color(0xffffdad7),
      onSecondaryFixed: Color(0xff2c0103),
      secondaryFixedDim: Color(0xffffb3af),
      onSecondaryFixedVariant: Color(0xff5e2322),
      tertiaryFixed: Color(0xffdfe0ff),
      onTertiaryFixed: Color(0xff020841),
      tertiaryFixedDim: Color(0xffbcc2ff),
      onTertiaryFixedVariant: Color(0xff2a3167),
      surfaceDim: Color(0xff141318),
      surfaceBright: Color(0xff46434a),
      surfaceContainerLowest: Color(0xff08070c),
      surfaceContainerLow: Color(0xff1e1d22),
      surfaceContainer: Color(0xff29272d),
      surfaceContainerHigh: Color(0xff333238),
      surfaceContainerHighest: Color(0xff3f3d43),
    );
  }

  ThemeData darkMediumContrast() {
    return theme(darkMediumContrastScheme());
  }

  static ColorScheme darkHighContrastScheme() {
    return const ColorScheme(
      brightness: Brightness.dark,
      primary: Color(0xfffff0b3),
      surfaceTint: Color(0xffd9c76f),
      onPrimary: Color(0xff000000),
      primaryContainer: Color(0xffd5c36c),
      onPrimaryContainer: Color(0xff0f0b00),
      secondary: Color(0xffffecea),
      onSecondary: Color(0xff000000),
      secondaryContainer: Color(0xffffaea9),
      onSecondaryContainer: Color(0xff220001),
      tertiary: Color(0xfff0eeff),
      onTertiary: Color(0xff000000),
      tertiaryContainer: Color(0xffb7befd),
      onTertiaryContainer: Color(0xff000436),
      error: Color(0xffd5fcb5),
      onError: Color(0xff000000),
      errorContainer: Color(0xffa9ce8b),
      onErrorContainer: Color(0xff030e00),
      surface: Color(0xff141318),
      onSurface: Color(0xffffffff),
      onSurfaceVariant: Color(0xffffffff),
      outline: Color(0xffedf0f9),
      outlineVariant: Color(0xffbfc2cb),
      shadow: Color(0xff000000),
      scrim: Color(0xff000000),
      inverseSurface: Color(0xffe6e1e9),
      inversePrimary: Color(0xff534800),
      primaryFixed: Color(0xfff6e388),
      onPrimaryFixed: Color(0xff000000),
      primaryFixedDim: Color(0xffd9c76f),
      onPrimaryFixedVariant: Color(0xff151100),
      secondaryFixed: Color(0xffffdad7),
      onSecondaryFixed: Color(0xff000000),
      secondaryFixedDim: Color(0xffffb3af),
      onSecondaryFixedVariant: Color(0xff2c0103),
      tertiaryFixed: Color(0xffdfe0ff),
      onTertiaryFixed: Color(0xff000000),
      tertiaryFixedDim: Color(0xffbcc2ff),
      onTertiaryFixedVariant: Color(0xff020841),
      surfaceDim: Color(0xff141318),
      surfaceBright: Color(0xff514f56),
      surfaceContainerLowest: Color(0xff000000),
      surfaceContainerLow: Color(0xff201f24),
      surfaceContainer: Color(0xff312f36),
      surfaceContainerHigh: Color(0xff3c3a41),
      surfaceContainerHighest: Color(0xff48464c),
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
    seed: Color(0xff00d68a),
    value: Color(0xff64d267),
    light: ColorFamily(
      color: Color(0xff3b693a),
      onColor: Color(0xffffffff),
      colorContainer: Color(0xffbcf0b4),
      onColorContainer: Color(0xff235024),
    ),
    lightMediumContrast: ColorFamily(
      color: Color(0xff3b693a),
      onColor: Color(0xffffffff),
      colorContainer: Color(0xffbcf0b4),
      onColorContainer: Color(0xff235024),
    ),
    lightHighContrast: ColorFamily(
      color: Color(0xff3b693a),
      onColor: Color(0xffffffff),
      colorContainer: Color(0xffbcf0b4),
      onColorContainer: Color(0xff235024),
    ),
    dark: ColorFamily(
      color: Color(0xffa1d39a),
      onColor: Color(0xff09390f),
      colorContainer: Color(0xff235024),
      onColorContainer: Color(0xffbcf0b4),
    ),
    darkMediumContrast: ColorFamily(
      color: Color(0xffa1d39a),
      onColor: Color(0xff09390f),
      colorContainer: Color(0xff235024),
      onColorContainer: Color(0xffbcf0b4),
    ),
    darkHighContrast: ColorFamily(
      color: Color(0xffa1d39a),
      onColor: Color(0xff09390f),
      colorContainer: Color(0xff235024),
      onColorContainer: Color(0xffbcf0b4),
    ),
  );

  /// Custom Color 2
  static const customColor2 = ExtendedColor(
    seed: Color(0xffffe16b),
    value: Color(0xfffde26c),
    light: ColorFamily(
      color: Color(0xff6d5e0f),
      onColor: Color(0xffffffff),
      colorContainer: Color(0xfff8e287),
      onColorContainer: Color(0xff534600),
    ),
    lightMediumContrast: ColorFamily(
      color: Color(0xff6d5e0f),
      onColor: Color(0xffffffff),
      colorContainer: Color(0xfff8e287),
      onColorContainer: Color(0xff534600),
    ),
    lightHighContrast: ColorFamily(
      color: Color(0xff6d5e0f),
      onColor: Color(0xffffffff),
      colorContainer: Color(0xfff8e287),
      onColorContainer: Color(0xff534600),
    ),
    dark: ColorFamily(
      color: Color(0xffdbc66e),
      onColor: Color(0xff393000),
      colorContainer: Color(0xff534600),
      onColorContainer: Color(0xfff8e287),
    ),
    darkMediumContrast: ColorFamily(
      color: Color(0xffdbc66e),
      onColor: Color(0xff393000),
      colorContainer: Color(0xff534600),
      onColorContainer: Color(0xfff8e287),
    ),
    darkHighContrast: ColorFamily(
      color: Color(0xffdbc66e),
      onColor: Color(0xff393000),
      colorContainer: Color(0xff534600),
      onColorContainer: Color(0xfff8e287),
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
