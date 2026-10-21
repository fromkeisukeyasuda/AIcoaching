import { QuizGroup } from "./types";
import { complaintGroup } from "./complaint";
import { assessmentGroup } from "./assessment";

export type { QuizGroup, QuizQuestion, QuizTerm } from "./types";

/* クイズのグループ一覧。増やすときは、lib/quiz/ にファイルを足して、ここに加える */
export const QUIZ_GROUPS: QuizGroup[] = [complaintGroup, assessmentGroup];

export const getQuizGroup = (id: string | null | undefined) => QUIZ_GROUPS.find((g) => g.id === id);
