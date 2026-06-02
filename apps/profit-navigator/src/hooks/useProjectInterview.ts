import { useState, useCallback, useMemo } from "react";
import type { Project, ProjectStakeholderSplit } from "@/data/types";

export type SplitDraft = Omit<ProjectStakeholderSplit, "split_id" | "project_id">;

export interface InterviewAnswer {
  questionId: string;
  value: any;
  displayValue: string;
  confirmedAt: number;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  subtext?: string;
  inputType: "text" | "client-select" | "country-chips" | "model-chips" | "number-currency" | "number-percent" | "invoice-chips" | "partner-select" | "flat-fee-chips" | "recharge-chips" | "date-range" | "business-chips" | "textarea" | "stakeholders";
  required: boolean;
  skipLabel?: string;
  /** Dynamic props computed from current answers */
  dynamicProps?: (answers: Record<string, any>) => Record<string, any>;
}

const COUNTRY_CURRENCY: Record<string, string> = {
  Singapore: "SGD", Malaysia: "MYR", Indonesia: "IDR", India: "INR",
  "United States": "USD",
};

function getQuestionSequence(answers: Record<string, any>): InterviewQuestion[] {
  const model = answers.commercial_model;
  const isPassThrough = model === "PARTNER_PASS_THROUGH";
  const clientName = answers._clientName || "the client";
  const partnerName = answers._partnerName || "the partner";
  const currency = answers.currency || "SGD";

  const questions: InterviewQuestion[] = [
    {
      id: "project_name",
      question: "Let's start with the basics. What's the name of this project?",
      subtext: "Give it a name you'll recognise in reports — e.g. 'HP APAC Webinar Series Q2'",
      inputType: "text",
      required: true,
    },
    {
      id: "client_id",
      question: "Which client is this project for?",
      subtext: "Select an existing client or type to add a new one",
      inputType: "client-select",
      required: true,
    },
    {
      id: "country_of_delivery",
      question: "Where is the work being delivered?",
      subtext: "This sets the billing currency automatically",
      inputType: "country-chips",
      required: true,
    },
    {
      id: "commercial_model",
      question: "How is this engagement structured?",
      subtext: "This determines how revenue and payouts are calculated",
      inputType: "model-chips",
      required: true,
    },
  ];

  if (!isPassThrough) {
    questions.push(
      {
        id: "contracted_revenue_ex_tax",
        question: `What's the total contracted value of this project?`,
        subtext: `This is the amount ${clientName} will pay Enfactum, excluding tax. Check your SOW or quote.`,
        inputType: "number-currency",
        required: true,
        dynamicProps: () => ({ currency }),
      },
      {
        id: "margin_target_percent",
        question: "What gross margin are you targeting on this project?",
        subtext: "This is used to trigger alerts if the project dips below target. Typical consulting range is 35–45%.",
        inputType: "number-percent",
        required: true,
        dynamicProps: (a) => ({
          currency,
          revenue: a.contracted_revenue_ex_tax || 0,
        }),
      },
      {
        id: "invoice_model",
        question: `How will you invoice ${clientName}?`,
        inputType: "invoice-chips",
        required: true,
      },
    );
  } else {
    questions.push(
      {
        id: "external_partner_stakeholder_id",
        question: "Which external partner is running this deal?",
        subtext: "This is the company that has the prime contract with the end client",
        inputType: "partner-select",
        required: true,
      },
      {
        id: "partner_revenue_basis_ex_tax",
        question: `What is ${partnerName} paying Enfactum for this engagement?`,
        subtext: "This is the total subcontract value — what the partner invoices Enfactum for. Check your subcontractor agreement.",
        inputType: "number-currency",
        required: true,
        dynamicProps: () => ({ currency }),
      },
      {
        id: "flat_fee_percent",
        question: "Which platform fee tier applies to this partnership?",
        subtext: "This is Enfactum's fee — the percentage kept as gross margin before stakeholder payouts",
        inputType: "flat-fee-chips",
        required: true,
      },
      {
        id: "internal_recharge_applies",
        question: `Do Enfactum internal resource costs get recharged to ${partnerName}?`,
        subtext: "Switch ON if your internal team hours are billed back to the partner. Switch OFF for pure pass-through.",
        inputType: "recharge-chips",
        required: true,
      },
    );
  }

  // Shared questions
  questions.push(
    {
      id: "dates",
      question: "When does this project run?",
      inputType: "date-range",
      required: true,
    },
    {
      id: "business_type",
      question: "What type of work is this?",
      subtext: "Used for portfolio analytics — skip if you're not sure",
      inputType: "business-chips",
      required: false,
      skipLabel: "Skip",
    },
    {
      id: "description",
      question: "Any notes or context about this project?",
      subtext: "This is for internal reference only — clients don't see it",
      inputType: "textarea",
      required: false,
      skipLabel: "Skip",
    },
    {
      id: "stakeholders",
      question: "Who are the key stakeholders on this project?",
      subtext: "Add anyone who gets a payout from this project's revenue. You can always add more later.",
      inputType: "stakeholders",
      required: false,
      skipLabel: "No payouts to configure",
    },
  );

  return questions;
}

export interface InterviewState {
  answers: Record<string, any>;
  answerHistory: InterviewAnswer[];
  currentIndex: number;
  questions: InterviewQuestion[];
  currentQuestion: InterviewQuestion | null;
  isComplete: boolean;
  totalQuestions: number;
  answeredCount: number;
  currency: string;
  submitAnswer: (questionId: string, value: any, displayValue: string) => void;
  goBackTo: (questionId: string) => void;
  getProjectData: () => Omit<Project, "project_id" | "project_code">;
  getSplitDrafts: () => SplitDraft[];
  reset: () => void;
  loadFromDraft: (draft: any) => void;
  toDraft: () => any;
}

export function useProjectInterview(defaultClientId?: string): InterviewState {
  const [answers, setAnswers] = useState<Record<string, any>>(() => ({
    client_id: defaultClientId || "",
    currency: "SGD",
    margin_target_percent: 40,
    flat_fee_percent: 10,
    internal_recharge_applies: true,
    invoice_model: "Fixed Fee",
    start_date: "2026-01-01",
    end_date: "2026-12-31",
  }));
  const [answerHistory, setAnswerHistory] = useState<InterviewAnswer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const questions = useMemo(() => getQuestionSequence(answers), [answers]);

  const currentQuestion = currentIndex < questions.length ? questions[currentIndex] : null;
  const isComplete = currentIndex >= questions.length;

  const submitAnswer = useCallback((questionId: string, value: any, displayValue: string) => {
    setAnswers(prev => {
      const next = { ...prev, [questionId]: value };
      // Auto-set currency from country
      if (questionId === "country_of_delivery") {
        const cc = COUNTRY_CURRENCY[value];
        if (cc) next.currency = cc;
      }
      // Store date range parts
      if (questionId === "dates" && value) {
        next.start_date = value.start_date;
        next.end_date = value.end_date;
      }
      return next;
    });
    setAnswerHistory(prev => {
      // Remove any existing answer for this question
      const filtered = prev.filter(a => a.questionId !== questionId);
      return [...filtered, { questionId, value, displayValue, confirmedAt: Date.now() }];
    });
    // Advance to next question after a tick
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
    }, 50);
  }, []);

  const goBackTo = useCallback((questionId: string) => {
    const qIdx = questions.findIndex(q => q.id === questionId);
    if (qIdx < 0) return;
    // Clear answers from this point onward
    const questionIdsToRemove = questions.slice(qIdx).map(q => q.id);
    setAnswerHistory(prev => prev.filter(a => !questionIdsToRemove.includes(a.questionId)));
    setAnswers(prev => {
      const next = { ...prev };
      questionIdsToRemove.forEach(id => {
        if (id !== "currency") delete next[id];
      });
      return next;
    });
    setCurrentIndex(qIdx);
  }, [questions]);

  const getProjectData = useCallback((): Omit<Project, "project_id" | "project_code"> => {
    const isPassThrough = answers.commercial_model === "PARTNER_PASS_THROUGH";
    const base: any = {
      project_name: answers.project_name || "",
      client_id: answers.client_id || "",
      description: answers.description || "",
      country_of_delivery: answers.country_of_delivery || "Singapore",
      currency: answers.currency || "SGD",
      business_type: answers.business_type || "Consulting",
      start_date: answers.start_date || "2026-01-01",
      end_date: answers.end_date || "2026-12-31",
      commercial_model: answers.commercial_model || "ENFACTUM_LED",
      invoice_model: answers.invoice_model || "Fixed Fee",
      revenue_recognition_basis: "Invoices (Actual)",
      contracted_revenue_ex_tax: answers.contracted_revenue_ex_tax || 0,
      margin_target_percent: answers.margin_target_percent || 40,
      status: "Draft",
      approvals_status: "Pending",
      sales_person: "",
    };
    if (isPassThrough) {
      base.external_partner_stakeholder_id = answers.external_partner_stakeholder_id;
      base.partner_revenue_basis_ex_tax = answers.partner_revenue_basis_ex_tax || 0;
      base.flat_fee_percent = answers.flat_fee_percent || 10;
      base.pass_through_payout_basis = "ENFACTUM_NET_REVENUE";
      base.internal_recharge_applies = answers.internal_recharge_applies ?? true;
    }
    return base;
  }, [answers]);

  const getSplitDrafts = useCallback((): SplitDraft[] => {
    return answers._splitDrafts || [];
  }, [answers]);

  const reset = useCallback(() => {
    setAnswers({
      client_id: defaultClientId || "",
      currency: "SGD",
      margin_target_percent: 40,
      flat_fee_percent: 10,
      internal_recharge_applies: true,
      invoice_model: "Fixed Fee",
      start_date: "2026-01-01",
      end_date: "2026-12-31",
    });
    setAnswerHistory([]);
    setCurrentIndex(0);
  }, [defaultClientId]);

  const loadFromDraft = useCallback((draft: any) => {
    if (!draft) return;
    const restored: Record<string, any> = {
      ...draft.basics,
      ...draft.commercial,
      currency: draft.basics?.currency || "SGD",
      _splitDrafts: draft.splitDrafts || [],
    };
    setAnswers(restored);
    // Rebuild history from answers
    const qs = getQuestionSequence(restored);
    const history: InterviewAnswer[] = [];
    let lastIdx = 0;
    for (let i = 0; i < qs.length; i++) {
      const q = qs[i];
      const val = restored[q.id];
      if (val !== undefined && val !== "" && val !== null) {
        history.push({ questionId: q.id, value: val, displayValue: String(val), confirmedAt: Date.now() });
        lastIdx = i + 1;
      } else {
        break;
      }
    }
    setAnswerHistory(history);
    setCurrentIndex(lastIdx);
  }, []);

  const toDraft = useCallback(() => {
    const isPassThrough = answers.commercial_model === "PARTNER_PASS_THROUGH";
    return {
      step: currentIndex,
      basics: {
        project_name: answers.project_name || "",
        client_id: answers.client_id || "",
        description: answers.description || "",
        country_of_delivery: answers.country_of_delivery || "Singapore",
        currency: answers.currency || "SGD",
        business_type: answers.business_type || "Consulting",
        start_date: answers.start_date || "2026-01-01",
        end_date: answers.end_date || "2026-12-31",
      },
      commercial: {
        commercial_model: answers.commercial_model || "ENFACTUM_LED",
        invoice_model: answers.invoice_model || "Fixed Fee",
        revenue_recognition_basis: "Invoices (Actual)",
        contracted_revenue_ex_tax: answers.contracted_revenue_ex_tax || 0,
        margin_target_percent: answers.margin_target_percent || 40,
        external_partner_stakeholder_id: answers.external_partner_stakeholder_id || "",
        partner_revenue_basis_ex_tax: answers.partner_revenue_basis_ex_tax || 0,
        flat_fee_percent: answers.flat_fee_percent || 10,
        pass_through_payout_basis: "ENFACTUM_NET_REVENUE",
        internal_recharge_applies: answers.internal_recharge_applies ?? true,
      },
      splitDrafts: answers._splitDrafts || [],
      budget: { planned_internal_hours: 0, planned_vendor_budget: 0, planned_other_budget: 0 },
    };
  }, [answers, currentIndex]);

  return {
    answers,
    answerHistory,
    currentIndex,
    questions,
    currentQuestion,
    isComplete,
    totalQuestions: questions.length,
    answeredCount: answerHistory.length,
    currency: answers.currency || "SGD",
    submitAnswer,
    goBackTo,
    getProjectData,
    getSplitDrafts,
    reset,
    loadFromDraft,
    toDraft,
  };
}
