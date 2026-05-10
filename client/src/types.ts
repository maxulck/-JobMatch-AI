export type AnalyzeRequest = {
  jobOffer: string;
  cv: string;
};

export type InterviewQuestion = {
  question: string;
  tip: string;
};

export type AnalyzeResponse = {
  score: number;
  matchingSkills: string[];
  missingSkills: string[];
  coverLetter: string;
  interviewQuestions: InterviewQuestion[];
};
