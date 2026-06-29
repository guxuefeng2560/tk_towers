enum LanguageEnumValues {
    ENGLISH = 0,
    // PORTUGUESE = -1,
    // CHINESE_SIMPLIFIED = -1,
    // CHINESE_TRADITIONAL = -1,
    // SPANISH = -1,
    // INDONESIA = -1,
    // FRENCH = -1,
    // GERMAN = -1,
    // JAPANESE = -1,
}

const LanguageString: string[] = [
    'en',
    // 'pt',
    // 'cn',
    // 'tw',
    // 'es',
    // 'in',
    // 'fr',
    // 'de',
    // 'ja'
];

interface LanguageEnumInterface {
    ENGLISH: number;
    // PORTUGUESE: number;
    // CHINESE_SIMPLIFIED: number;
    // CHINESE_TRADITIONAL: number;
    // SPANISH: number;
    // INDONESIA: number;
    // FRENCH: number;
    // GERMAN: number;
    // JAPANESE: number;
    is(languageShorten: string, languageIndex: number): boolean;
    get(languageIndex: number): string;
    toEnum(languageShorten: string): number;
    toFullString(languageShorten: string): string;
    getLanguages(): string[];
}

const LanguageEnum: LanguageEnumInterface = {
    ENGLISH: LanguageEnumValues.ENGLISH,
    // PORTUGUESE: LanguageEnumValues.PORTUGUESE,
    // CHINESE_SIMPLIFIED: LanguageEnumValues.CHINESE_SIMPLIFIED,
    // CHINESE_TRADITIONAL: LanguageEnumValues.CHINESE_TRADITIONAL,
    // SPANISH: LanguageEnumValues.SPANISH,
    // INDONESIA: LanguageEnumValues.INDONESIA,
    // FRENCH: LanguageEnumValues.FRENCH,
    // GERMAN: LanguageEnumValues.GERMAN,
    // JAPANESE: LanguageEnumValues.JAPANESE,

    is(languageShorten: string, languageIndex: number): boolean {
        return LanguageString[languageIndex] === languageShorten;
    },

    get(languageIndex: number): string {
        return LanguageString[languageIndex];
    },

    toEnum(languageShorten: string): number {
        return LanguageString.indexOf(languageShorten);
    },

    toFullString(languageShorten: string): string {
        const index = LanguageString.indexOf(languageShorten);
        return Object.keys(LanguageEnumValues)[index] || '';
    },

    getLanguages(): string[] {
        return LanguageString;
    },
};

export default LanguageEnum;
