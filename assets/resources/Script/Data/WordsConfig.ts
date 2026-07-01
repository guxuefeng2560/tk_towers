import { AbsJSONNConfigLoader } from "../Framework/config/TD_AbsJSONConfigLoader";

export interface WordsConfigItem {
    id: number;
    unit_id: number;
    question_type: number;
    prompt: string | null;
    option_1: string | null;
    option_2: string | null;
    option_3: string | null;
    correct_option: number | null;
    match_left_1: string | null;
    match_left_2: string | null;
    match_left_3: string | null;
    match_right_1: string | null;
    match_right_2: string | null;
    match_right_3: string | null;
    sort_sentence: string | null;
}

export default class WordsConfig extends AbsJSONNConfigLoader<WordsConfigItem> {
    protected configPath(): string {
        return "config/words_config";
    }
}
