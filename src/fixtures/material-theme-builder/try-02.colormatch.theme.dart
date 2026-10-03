import "package:flutter/material.dart";

class MaterialTheme {
  final TextTheme textTheme;

  const MaterialTheme(this.textTheme);

  static ColorScheme lightScheme() {
    return const ColorScheme(
      brightness: Brightness.light,
      primary: Color(0xff6d5e00),
      surfaceTint: Color(0xff6d5e00),
      onPrimary: Color(0xffffffff),
      primaryContainer: Color(0xffcab337),
      onPrimaryContainer: Color(0xff504500),
      secondary: Color(0xff8f2225),
      onSecondary: Color(0xffffffff),
      secondaryContainer: Color(0xffb03a3a),
      onSecondaryContainer: Color(0xffffd7d5),
      tertiary: Color(0xff001daf),
      onTertiary: Color(0xffffffff),
      tertiaryContainer: Color(0xff2138d2),
      onTertiaryContainer: Color(0xffb5bdff),
      error: Color(0xff316900),
      onError: Color(0xffffffff),
      errorContainer: Color(0xff408400),
      onErrorContainer: Color(0xfff9ffed),
      surface: Color(0xfffdf8ff),
      onSurface: Color(0xff1c1b22),
      onSurfaceVariant: Color(0xff404752),
      outline: Color(0xff717784),
      outlineVariant: Color(0xffc0c7d4),
      shadow: Color(0xff000000),
      scrim: Color(0xff000000),
      inverseSurface: Color(0xff312f37),
      inversePrimary: Color(0xffdec649),
      primaryFixed: Color(0xfffce362),
      onPrimaryFixed: Color(0xff211b00),
      primaryFixedDim: Color(0xffdec649),
      onPrimaryFixedVariant: Color(0xff524600),
      secondaryFixed: Color(0xffffdad7),
      onSecondaryFixed: Color(0xff410005),
      secondaryFixedDim: Color(0xffffb3af),
      onSecondaryFixedVariant: Color(0xff881d21),
      tertiaryFixed: Color(0xffdfe0ff),
      onTertiaryFixed: Color(0xff000c62),
      tertiaryFixedDim: Color(0xffbcc2ff),
      onTertiaryFixedVariant: Color(0xff122cca),
      surfaceDim: Color(0xffddd8e2),
      surfaceBright: Color(0xfffdf8ff),
      surfaceContainerLowest: Color(0xffffffff),
      surfaceContainerLow: Color(0xfff7f1fc),
      surfaceContainer: Color(0xfff1ecf6),
      surfaceContainerHigh: Color(0xffece6f0),
      surfaceContainerHighest: Color(0xffe6e0eb),
    );
  }

  ThemeData light() {
    return theme(lightScheme());
  }

  static ColorScheme lightMediumContrastScheme() {
    return const ColorScheme(
      brightness: Brightness.light,
      primary: Color(0xff3f3600),
      surfaceTint: Color(0xff6d5e00),
      onPrimary: Color(0xffffffff),
      primaryContainer: Color(0xff7e6d00),
      onPrimaryContainer: Color(0xffffffff),
      secondary: Color(0xff710812),
      onSecondary: Color(0xffffffff),
      secondaryContainer: Color(0xffb03a3a),
      onSecondaryContainer: Color(0xffffffff),
      tertiary: Color(0xff001ca9),
      onTertiary: Color(0xffffffff),
      tertiaryContainer: Color(0xff2138d2),
      onTertiaryContainer: Color(0xffedecff),
      error: Color(0xff1b3e00),
      onError: Color(0xffffffff),
      errorContainer: Color(0xff3b7c00),
      onErrorContainer: Color(0xffffffff),
      surface: Color(0xfffdf8ff),
      onSurface: Color(0xff121017),
      onSurfaceVariant: Color(0xff303741),
      outline: Color(0xff4c535e),
      outlineVariant: Color(0xff676d7a),
      shadow: Color(0xff000000),
      scrim: Color(0xff000000),
      inverseSurface: Color(0xff312f37),
      inversePrimary: Color(0xffdec649),
      primaryFixed: Color(0xff7e6d00),
      onPrimaryFixed: Color(0xffffffff),
      primaryFixedDim: Color(0xff625400),
      onPrimaryFixedVariant: Color(0xffffffff),
      secondaryFixed: Color(0xffbd4343),
      onSecondaryFixed: Color(0xffffffff),
      secondaryFixedDim: Color(0xff9c2b2d),
      onSecondaryFixedVariant: Color(0xffffffff),
      tertiaryFixed: Color(0xff475cf1),
      onTertiaryFixed: Color(0xffffffff),
      tertiaryFixedDim: Color(0xff293fd8),
      onTertiaryFixedVariant: Color(0xffffffff),
      surfaceDim: Color(0xffc9c5ce),
      surfaceBright: Color(0xfffdf8ff),
      surfaceContainerLowest: Color(0xffffffff),
      surfaceContainerLow: Color(0xfff7f1fc),
      surfaceContainer: Color(0xffece6f0),
      surfaceContainerHigh: Color(0xffe0dbe5),
      surfaceContainerHighest: Color(0xffd5d0da),
    );
  }

  ThemeData lightMediumContrast() {
    return theme(lightMediumContrastScheme());
  }

  static ColorScheme lightHighContrastScheme() {
    return const ColorScheme(
      brightness: Brightness.light,
      primary: Color(0xff342c00),
      surfaceTint: Color(0xff6d5e00),
      onPrimary: Color(0xffffffff),
      primaryContainer: Color(0xff554900),
      onPrimaryContainer: Color(0xffffffff),
      secondary: Color(0xff60000b),
      onSecondary: Color(0xffffffff),
      secondaryContainer: Color(0xff8c1f23),
      onSecondaryContainer: Color(0xffffffff),
      tertiary: Color(0xff00168e),
      onTertiary: Color(0xffffffff),
      tertiaryContainer: Color(0xff1730cc),
      onTertiaryContainer: Color(0xffffffff),
      error: Color(0xff153300),
      onError: Color(0xffffffff),
      errorContainer: Color(0xff265300),
      onErrorContainer: Color(0xffffffff),
      surface: Color(0xfffdf8ff),
      onSurface: Color(0xff000000),
      onSurfaceVariant: Color(0xff000000),
      outline: Color(0xff262c37),
      outlineVariant: Color(0xff434a55),
      shadow: Color(0xff000000),
      scrim: Color(0xff000000),
      inverseSurface: Color(0xff312f37),
      inversePrimary: Color(0xffdec649),
      primaryFixed: Color(0xff554900),
      onPrimaryFixed: Color(0xffffffff),
      primaryFixedDim: Color(0xff3b3200),
      onPrimaryFixedVariant: Color(0xffffffff),
      secondaryFixed: Color(0xff8c1f23),
      onSecondaryFixed: Color(0xffffffff),
      secondaryFixedDim: Color(0xff6b030f),
      onSecondaryFixedVariant: Color(0xffffffff),
      tertiaryFixed: Color(0xff1730cc),
      onTertiaryFixed: Color(0xffffffff),
      tertiaryFixedDim: Color(0xff001aa0),
      onTertiaryFixedVariant: Color(0xffffffff),
      surfaceDim: Color(0xffbbb7c1),
      surfaceBright: Color(0xfffdf8ff),
      surfaceContainerLowest: Color(0xffffffff),
      surfaceContainerLow: Color(0xfff4eff9),
      surfaceContainer: Color(0xffe6e0eb),
      surfaceContainerHigh: Color(0xffd8d2dc),
      surfaceContainerHighest: Color(0xffc9c5ce),
    );
  }

  ThemeData lightHighContrast() {
    return theme(lightHighContrastScheme());
  }

  static ColorScheme darkScheme() {
    return const ColorScheme(
      brightness: Brightness.dark,
      primary: Color(0xffe7cf50),
      surfaceTint: Color(0xffdec649),
      onPrimary: Color(0xff393000),
      primaryContainer: Color(0xffcab337),
      onPrimaryContainer: Color(0xff504500),
      secondary: Color(0xffffb3af),
      onSecondary: Color(0xff68010d),
      secondaryContainer: Color(0xffb03a3a),
      onSecondaryContainer: Color(0xffffd7d5),
      tertiary: Color(0xffbcc2ff),
      onTertiary: Color(0xff00189a),
      tertiaryContainer: Color(0xff2138d2),
      onTertiaryContainer: Color(0xffb5bdff),
      error: Color(0xff8adb50),
      onError: Color(0xff173800),
      errorContainer: Color(0xff56a31a),
      onErrorContainer: Color(0xff091d00),
      surface: Color(0xff141219),
      onSurface: Color(0xffe6e0eb),
      onSurfaceVariant: Color(0xffc0c7d4),
      outline: Color(0xff8a919e),
      outlineVariant: Color(0xff404752),
      shadow: Color(0xff000000),
      scrim: Color(0xff000000),
      inverseSurface: Color(0xffe6e0eb),
      inversePrimary: Color(0xff6d5e00),
      primaryFixed: Color(0xfffce362),
      onPrimaryFixed: Color(0xff211b00),
      primaryFixedDim: Color(0xffdec649),
      onPrimaryFixedVariant: Color(0xff524600),
      secondaryFixed: Color(0xffffdad7),
      onSecondaryFixed: Color(0xff410005),
      secondaryFixedDim: Color(0xffffb3af),
      onSecondaryFixedVariant: Color(0xff881d21),
      tertiaryFixed: Color(0xffdfe0ff),
      onTertiaryFixed: Color(0xff000c62),
      tertiaryFixedDim: Color(0xffbcc2ff),
      onTertiaryFixedVariant: Color(0xff122cca),
      surfaceDim: Color(0xff141219),
      surfaceBright: Color(0xff3a3840),
      surfaceContainerLowest: Color(0xff0f0d14),
      surfaceContainerLow: Color(0xff1c1b22),
      surfaceContainer: Color(0xff201f26),
      surfaceContainerHigh: Color(0xff2b2930),
      surfaceContainerHighest: Color(0xff36343b),
    );
  }

  ThemeData dark() {
    return theme(darkScheme());
  }

  static ColorScheme darkMediumContrastScheme() {
    return const ColorScheme(
      brightness: Brightness.dark,
      primary: Color(0xfff6dc5d),
      surfaceTint: Color(0xffdec649),
      onPrimary: Color(0xff2c2500),
      primaryContainer: Color(0xffcab337),
      onPrimaryContainer: Color(0xff2f2700),
      secondary: Color(0xffffd2ce),
      onSecondary: Color(0xff540008),
      secondaryContainer: Color(0xffec6663),
      onSecondaryContainer: Color(0xff000000),
      tertiary: Color(0xffd7daff),
      onTertiary: Color(0xff00127d),
      tertiaryContainer: Color(0xff7686ff),
      onTertiaryContainer: Color(0xff000000),
      error: Color(0xff9ff264),
      onError: Color(0xff112c00),
      errorContainer: Color(0xff56a31a),
      onErrorContainer: Color(0xff000000),
      surface: Color(0xff141219),
      onSurface: Color(0xffffffff),
      onSurfaceVariant: Color(0xffd6dceb),
      outline: Color(0xffabb2c0),
      outlineVariant: Color(0xff8a919d),
      shadow: Color(0xff000000),
      scrim: Color(0xff000000),
      inverseSurface: Color(0xffe6e0eb),
      inversePrimary: Color(0xff534800),
      primaryFixed: Color(0xfffce362),
      onPrimaryFixed: Color(0xff151100),
      primaryFixedDim: Color(0xffdec649),
      onPrimaryFixedVariant: Color(0xff3f3600),
      secondaryFixed: Color(0xffffdad7),
      onSecondaryFixed: Color(0xff2d0002),
      secondaryFixedDim: Color(0xffffb3af),
      onSecondaryFixedVariant: Color(0xff710812),
      tertiaryFixed: Color(0xffdfe0ff),
      onTertiaryFixed: Color(0xff000645),
      tertiaryFixedDim: Color(0xffbcc2ff),
      onTertiaryFixedVariant: Color(0xff001ca9),
      surfaceDim: Color(0xff141219),
      surfaceBright: Color(0xff46434b),
      surfaceContainerLowest: Color(0xff08070d),
      surfaceContainerLow: Color(0xff1e1d24),
      surfaceContainer: Color(0xff29272e),
      surfaceContainerHigh: Color(0xff343139),
      surfaceContainerHighest: Color(0xff3f3c44),
    );
  }

  ThemeData darkMediumContrast() {
    return theme(darkMediumContrastScheme());
  }

  static ColorScheme darkHighContrastScheme() {
    return const ColorScheme(
      brightness: Brightness.dark,
      primary: Color(0xfffff0b3),
      surfaceTint: Color(0xffdec649),
      onPrimary: Color(0xff000000),
      primaryContainer: Color(0xffdac345),
      onPrimaryContainer: Color(0xff0f0b00),
      secondary: Color(0xffffecea),
      onSecondary: Color(0xff000000),
      secondaryContainer: Color(0xffffaea9),
      onSecondaryContainer: Color(0xff220001),
      tertiary: Color(0xfff0eeff),
      onTertiary: Color(0xff000000),
      tertiaryContainer: Color(0xffb7beff),
      onTertiaryContainer: Color(0xff000436),
      error: Color(0xffccffa4),
      onError: Color(0xff000000),
      errorContainer: Color(0xff86d74c),
      onErrorContainer: Color(0xff030e00),
      surface: Color(0xff141219),
      onSurface: Color(0xffffffff),
      onSurfaceVariant: Color(0xffffffff),
      outline: Color(0xffeaf0ff),
      outlineVariant: Color(0xffbcc3d1),
      shadow: Color(0xff000000),
      scrim: Color(0xff000000),
      inverseSurface: Color(0xffe6e0eb),
      inversePrimary: Color(0xff534800),
      primaryFixed: Color(0xfffce362),
      onPrimaryFixed: Color(0xff000000),
      primaryFixedDim: Color(0xffdec649),
      onPrimaryFixedVariant: Color(0xff151100),
      secondaryFixed: Color(0xffffdad7),
      onSecondaryFixed: Color(0xff000000),
      secondaryFixedDim: Color(0xffffb3af),
      onSecondaryFixedVariant: Color(0xff2d0002),
      tertiaryFixed: Color(0xffdfe0ff),
      onTertiaryFixed: Color(0xff000000),
      tertiaryFixedDim: Color(0xffbcc2ff),
      onTertiaryFixedVariant: Color(0xff000645),
      surfaceDim: Color(0xff141219),
      surfaceBright: Color(0xff514f57),
      surfaceContainerLowest: Color(0xff000000),
      surfaceContainerLow: Color(0xff201f26),
      surfaceContainer: Color(0xff312f37),
      surfaceContainerHigh: Color(0xff3c3a42),
      surfaceContainerHighest: Color(0xff48454e),
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
      color: Color(0xff006e1d),
      onColor: Color(0xffffffff),
      colorContainer: Color(0xff64d267),
      onColorContainer: Color(0xff005815),
    ),
    lightMediumContrast: ColorFamily(
      color: Color(0xff006e1d),
      onColor: Color(0xffffffff),
      colorContainer: Color(0xff64d267),
      onColorContainer: Color(0xff005815),
    ),
    lightHighContrast: ColorFamily(
      color: Color(0xff006e1d),
      onColor: Color(0xffffffff),
      colorContainer: Color(0xff64d267),
      onColorContainer: Color(0xff005815),
    ),
    dark: ColorFamily(
      color: Color(0xff80ef80),
      onColor: Color(0xff00390a),
      colorContainer: Color(0xff64d267),
      onColorContainer: Color(0xff005815),
    ),
    darkMediumContrast: ColorFamily(
      color: Color(0xff80ef80),
      onColor: Color(0xff00390a),
      colorContainer: Color(0xff64d267),
      onColorContainer: Color(0xff005815),
    ),
    darkHighContrast: ColorFamily(
      color: Color(0xff80ef80),
      onColor: Color(0xff00390a),
      colorContainer: Color(0xff64d267),
      onColorContainer: Color(0xff005815),
    ),
  );

  /// Custom Color 2
  static const customColor2 = ExtendedColor(
    seed: Color(0xffffe16b),
    value: Color(0xfffde26c),
    light: ColorFamily(
      color: Color(0xff6e5e00),
      onColor: Color(0xffffffff),
      colorContainer: Color(0xfffde26c),
      onColorContainer: Color(0xff756400),
    ),
    lightMediumContrast: ColorFamily(
      color: Color(0xff6e5e00),
      onColor: Color(0xffffffff),
      colorContainer: Color(0xfffde26c),
      onColorContainer: Color(0xff756400),
    ),
    lightHighContrast: ColorFamily(
      color: Color(0xff6e5e00),
      onColor: Color(0xffffffff),
      colorContainer: Color(0xfffde26c),
      onColorContainer: Color(0xff756400),
    ),
    dark: ColorFamily(
      color: Color(0xffffffff),
      onColor: Color(0xff393000),
      colorContainer: Color(0xfffde26c),
      onColorContainer: Color(0xff756400),
    ),
    darkMediumContrast: ColorFamily(
      color: Color(0xffffffff),
      onColor: Color(0xff393000),
      colorContainer: Color(0xfffde26c),
      onColorContainer: Color(0xff756400),
    ),
    darkHighContrast: ColorFamily(
      color: Color(0xffffffff),
      onColor: Color(0xff393000),
      colorContainer: Color(0xfffde26c),
      onColorContainer: Color(0xff756400),
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
