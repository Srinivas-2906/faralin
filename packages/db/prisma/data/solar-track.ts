import { ProblemTrackDifficultyBand, FaralinTrustLevel } from '@prisma/client';
import {
  advancedAwardBands,
  defaultScienceRubric,
  type ProblemTrackSection,
  type ProblemTrackSeedDef,
} from './problem-track-shared';

type ProblemTrackSection = ProblemTrackSeedDef['sections'][number];

const learnAiPolicy = {
  allowed: ['explain concepts', 'simplify wording', 'give examples', 'ask checking questions', 'correct misconceptions'],
  forbidden: ['complete final answers', 'write the student full submission'],
};

const practiceAiPolicy = {
  allowed: ['give one hint at a time', 'explain mistakes', 'ask student to retry'],
  forbidden: ['fill in the full calculation unless the student has tried'],
};

const solveAiPolicy = {
  allowed: ['guide next step', 'check working', 'ask clarifying questions'],
  forbidden: ['provide full sizing calculation', 'give final kW answer'],
};

const finalBuilderAiPolicy = {
  allowed: ['organise student answers', 'improve grammar', 'identify missing sections', 'ask student to confirm'],
  forbidden: ['invent measurements', 'hide mistakes', 'replace weak reasoning without student input'],
};

export const physicsRubric = defaultScienceRubric.map((cat) => {
  if (cat.name === 'Scientific understanding') {
    return {
      ...cat,
      descriptors: {
        excellent: 'Accurate use of power, energy, and efficiency concepts throughout.',
        strong: 'Most physics concepts used correctly with minor gaps.',
        developing: 'Basic understanding shown but units or terms misused.',
        weak: 'Little evidence of physics understanding.',
      },
    };
  }
  if (cat.name === 'Correct use of method') {
    return {
      ...cat,
      descriptors: {
        excellent: 'Systematic energy balance and sizing method applied.',
        strong: 'Method mostly correct with small procedural errors.',
        developing: 'Method attempted but steps missing or inconsistent.',
        weak: 'No clear method demonstrated.',
      },
    };
  }
  return cat;
});

export const solarTrackSections: ProblemTrackSection[] = [
  {
    id: 'orientation',
    type: 'ORIENTATION',
    title: 'What you will do',
    content: `You will learn how power, energy, and efficiency relate when sizing a solar array.

You will calculate whether a school science block can run essential equipment during a power cut using rooftop solar.

You will produce a short engineering investigation with calculations, assumptions, and honest limitations.

**Important:** The AI tutor can help you understand and organise your work. It cannot give you the final array size without your own working.`,
    inputs: [
      {
        id: 'ready_confirm',
        label: 'I understand what I will produce and how I will be judged',
        type: 'multiple_choice',
        required: true,
        options: ['Yes, I am ready to begin'],
      },
    ],
    aiPolicy: learnAiPolicy,
  },
  {
    id: 'story',
    type: 'STORY',
    title: 'Lights out in the science block',
    content: `Riverside Academy's science block hosts six labs, a prep room, and a data-logging suite. After three storm-related outages last term, the headteacher asked students to investigate backup power.

The roof can fit a limited solar array. The question is not "should we go green?" but **how much equipment could realistically run during a daytime outage** if the school installs panels and battery storage.

You have been sent a simplified equipment list and roof measurements. Your job is to size the system and explain your reasoning clearly enough that a facilities manager could follow it.`,
    inputs: [],
    aiPolicy: learnAiPolicy,
    unlockRules: [{ requiresSectionId: 'orientation' }],
  },
  {
    id: 'core_question',
    type: 'CORE_QUESTION',
    title: 'The core question',
    content: `By the end of this Problem Track, you will answer:

**What peak power (kW) of solar panels is needed to run the essential science-block equipment for 5 hours on a sunny day, assuming 75% system efficiency?**

You must show daily energy demand, account for efficiency losses, and state your assumptions clearly.`,
    inputs: [
      {
        id: 'question_restate',
        label: 'In your own words, what must you calculate?',
        type: 'long_text',
        required: true,
        placeholder: 'Restate the sizing problem in one or two sentences...',
      },
    ],
    aiPolicy: learnAiPolicy,
    unlockRules: [{ requiresSectionId: 'story' }],
  },
  {
    id: 'learn_1',
    type: 'LEARN',
    title: 'Learn: Power and energy',
    content: `**Power (P)** is the rate energy is used, measured in watts (W) or kilowatts (kW).

**Energy (E)** is power × time: E = P × t

Example: A 2 kW heater running for 3 hours uses 6 kWh of energy.

**kW** = kilowatts (power). **kWh** = kilowatt-hours (energy). Do not confuse them.`,
    inputs: [
      {
        id: 'power_energy_check',
        label: 'A 500 W projector runs for 2 hours. How many kWh does it use?',
        type: 'multiple_choice',
        required: true,
        options: ['0.25 kWh', '1 kWh', '2 kWh', '1000 kWh'],
      },
    ],
    aiPolicy: learnAiPolicy,
    unlockRules: [{ requiresSectionId: 'core_question' }],
  },
  {
    id: 'learn_2',
    type: 'LEARN',
    title: 'Learn: Efficiency and sizing',
    content: `Solar systems lose energy in the inverter, wiring, and battery round-trip. We model this with **system efficiency** (η).

Usable energy = Solar input × η

To size panels: if you need **E_required** kWh and panels produce **P_panel** kW for **t** hours at η efficiency:

E_required = P_panel × t × η

Rearrange to find P_panel when you know the energy demand.`,
    inputs: [
      {
        id: 'efficiency_check',
        label: 'If η = 0.75, what fraction of solar input reaches the equipment?',
        type: 'multiple_choice',
        required: true,
        options: ['25%', '75%', '100%', '0.75%'],
      },
    ],
    aiPolicy: learnAiPolicy,
    unlockRules: [{ requiresSectionId: 'learn_1' }],
  },
  {
    id: 'practice',
    type: 'PRACTICE',
    title: 'Practice: One appliance',
    content: `A fume-cupboard fan draws **0.4 kW** and must run for **4 hours** during an outage.

Calculate the energy required in **kWh**. Show your working.`,
    inputs: [
      {
        id: 'practice_energy',
        label: 'Energy required (kWh)',
        type: 'short_text',
        required: true,
        placeholder: 'e.g. 1.6',
      },
      {
        id: 'practice_working',
        label: 'Show your calculation',
        type: 'long_text',
        required: true,
      },
    ],
    aiPolicy: practiceAiPolicy,
    unlockRules: [{ requiresSectionId: 'learn_2' }],
  },
  {
    id: 'solve_1',
    type: 'SOLVE',
    title: 'Main solve: Total daily demand',
    content: `Essential equipment during an outage:

| Equipment | Power (kW) | Hours needed |
|-----------|-----------|--------------|
| Lab lighting | 1.2 | 5 |
| Data loggers | 0.3 | 5 |
| Fume fans (×3) | 0.4 each | 4 |
| Refrigerator | 0.15 | 5 |

Calculate the **total energy demand** in kWh. Show each line of your calculation.`,
    inputs: [
      {
        id: 'demand_calc',
        label: 'Step-by-step energy demand calculation',
        type: 'long_text',
        required: true,
      },
      {
        id: 'total_demand',
        label: 'Total energy demand (kWh)',
        type: 'short_text',
        required: true,
      },
    ],
    aiPolicy: solveAiPolicy,
    unlockRules: [{ requiresSectionId: 'practice' }],
  },
  {
    id: 'solve_2',
    type: 'SOLVE',
    title: 'Main solve: Array peak power',
    content: `Using your total demand, size the solar array:

- Outage duration for solar collection: **5 hours** of useful sun
- System efficiency η = **0.75**
- Use: E_required = P_panel × t × η

Calculate **P_panel** in kW. Round sensibly and explain any assumptions.`,
    inputs: [
      {
        id: 'sizing_calc',
        label: 'Your sizing calculation',
        type: 'long_text',
        required: true,
      },
      {
        id: 'peak_power',
        label: 'Peak panel power required (kW)',
        type: 'short_text',
        required: true,
      },
    ],
    aiPolicy: solveAiPolicy,
    unlockRules: [{ requiresSectionId: 'solve_1' }],
  },
  {
    id: 'personalise',
    type: 'PERSONALISE',
    title: 'Personal application: Your home',
    content: `Pick **one appliance** in your home. Estimate its power (check a label or research), and estimate how many hours you use it on a school day.

Calculate its daily energy use in kWh and compare it to one item from the science block list.`,
    inputs: [
      {
        id: 'home_appliance',
        label: 'Appliance, estimated power, hours, and daily kWh',
        type: 'long_text',
        required: true,
      },
      {
        id: 'comparison',
        label: 'How does it compare to a science-block item?',
        type: 'long_text',
        required: true,
      },
    ],
    aiPolicy: solveAiPolicy,
    unlockRules: [{ requiresSectionId: 'solve_2' }],
  },
  {
    id: 'reflect',
    type: 'REFLECT',
    title: 'Model limitations',
    content: `Real solar sizing is more complex than this model. Weather, roof angle, shading, battery capacity, and peak vs average demand all matter.

Answer honestly:`,
    inputs: [
      {
        id: 'assumptions',
        label: 'What assumptions did we make?',
        type: 'long_text',
        required: true,
      },
      {
        id: 'unrealistic',
        label: 'Which assumptions are unrealistic for Riverside Academy?',
        type: 'long_text',
        required: true,
      },
      {
        id: 'better_data',
        label: 'What extra data would improve your answer?',
        type: 'long_text',
        required: true,
      },
    ],
    aiPolicy: learnAiPolicy,
    unlockRules: [{ requiresSectionId: 'personalise' }],
  },
  {
    id: 'final_builder',
    type: 'FINAL_BUILDER',
    title: 'Build your final report',
    content: `Use the AI helper to assemble your answers into a polished engineering report (600–900 words).

Include: problem statement, method, demand table, sizing calculation, home comparison, and limitations.

**You must edit the draft before submission.**`,
    inputs: [
      {
        id: 'final_draft',
        label: 'Your final report (edit the AI draft)',
        type: 'long_text',
        required: true,
        placeholder: 'Click "Generate draft" to start, then edit...',
      },
    ],
    aiPolicy: finalBuilderAiPolicy,
    unlockRules: [{ requiresSectionId: 'reflect' }],
  },
  {
    id: 'review',
    type: 'REVIEW',
    title: 'Review before submit',
    content: `Check your final report:
- [ ] Core sizing question answered with kW value
- [ ] Energy demand calculation shown
- [ ] Efficiency accounted for
- [ ] Home appliance comparison included
- [ ] Limitations discussed
- [ ] Written in your own words`,
    inputs: [
      {
        id: 'review_confirm',
        label: 'I confirm this submission is my own work with permitted AI assistance',
        type: 'multiple_choice',
        required: true,
        options: ['I confirm and am ready to submit'],
      },
    ],
    aiPolicy: finalBuilderAiPolicy,
    unlockRules: [{ requiresSectionId: 'final_builder' }],
  },
  {
    id: 'submit',
    type: 'SUBMIT',
    title: 'Submit',
    content: `Once submitted, your work is locked and will be scored using the rubric. Faralins are awarded based on quality, not effort alone.`,
    inputs: [],
    aiPolicy: { allowed: ['completeness check'], forbidden: ['modify answers'] },
    unlockRules: [{ requiresSectionId: 'review' }],
  },
];

export const solarTrackDef: ProblemTrackSeedDef = {
  trackId: 'PHY-SOL-CORE-001',
  slug: 'solar-for-the-science-block',
  title: 'Solar for the Science Block',
  subtitle: 'Size backup power. Show your engineering reasoning.',
  subjectSlug: 'physics',
  secondarySubjectSlug: 'mathematics',
  difficultyBand: ProblemTrackDifficultyBand.CORE,
  yearLevels: ['Year 9', 'Year 10', 'Year 11', 'GCSE', 'IGCSE'],
  timeCapHours: 96,
  estimatedHoursMin: 2,
  estimatedHoursMax: 4,
  maxFaralins: 38000,
  bursaryValueApproxGbp: 152,
  outputType: 'Engineering report',
  partnerUniversityCategories: ['Physics', 'Engineering', 'Environmental Science', 'Mathematics', 'Natural Sciences'],
  skills: ['Energy', 'unit conversion', 'modelling', 'estimation'],
  prerequisites: ['Basic arithmetic', 'units (kW, kWh)', 'percentages'],
  regionCompatibility: ['UK', 'India', 'US', 'international'],
  trustLevel: FaralinTrustLevel.PARTNER_VERIFIED,
  sections: solarTrackSections,
  rubric: physicsRubric,
  awardBands: advancedAwardBands,
  moderationRules: {
    humanModerationAboveScore: 95,
    humanModerationOnLowTrust: true,
    plagiarismCheckRequired: true,
  },
};
