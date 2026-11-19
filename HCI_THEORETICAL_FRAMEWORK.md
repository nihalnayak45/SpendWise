# SpendWise — HCI Theoretical Framework & Usability Evaluation

This document outlines how **SpendWise** implements and validates core Human-Computer Interaction (HCI) theories, principles, and evaluation methodologies from the academic HCI syllabus.

---

## 1. Norman’s Seven Principles of Design

Donald Norman introduced seven foundational design principles in *The Design of Everyday Things*. SpendWise directly embodies each principle across its architecture:

| # | Norman's Principle | Definition | Implementation in SpendWise | Code Reference |
|---|---|---|---|---|
| **1** | **Discoverability** | It is easy to figure out what actions are possible and where they can be performed. | Primary actions are visually emphasized with prominent call-to-actions (e.g. `+ Add Expense` button in Header, `Simulate Decisions` banner in Dashboard, clear bottom navigation tabs on mobile). | [`Header.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/HCI/frontend/src/components/layout/Header.tsx#L42-L49), [`Dashboard.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/HCI/frontend/src/pages/Dashboard.tsx#L84-L91) |
| **2** | **Feedback** | The system continuously communicates the results of actions and changes in state. | Real-time visual feedback: dragging budget sliders immediately updates the circular health gauge and remaining funds. Toasts display green/red confirmations for database writes; interactive charts highlight bars on hover. | [`BudgetPlanner.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/HCI/frontend/src/pages/BudgetPlanner.tsx#L111-L125), [`Toast.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/HCI/frontend/src/components/common/Toast.tsx) |
| **3** | **Conceptual Model** | The mental model the user forms of how the system works matches the actual system design. | The system reflects a student's real-world financial mental model: *Income Budget → Distribute to Life Categories → Track Real Purchases → Remaining Balance & Goal Accumulation*. | [`BudgetContext.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/HCI/frontend/src/context/BudgetContext.tsx#L409-L435) |
| **4** | **Affordances** | The physical or perceived properties of an element that indicate how it can be used. | Sliders afford sliding (`<input type="range">`), buttons afford clicking (subtle box-shadows, rounded borders, active scaling `active:scale-95`), and text inputs afford typing. | [`BudgetPlanner.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/HCI/frontend/src/pages/BudgetPlanner.tsx#L43-L49), [`Header.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/HCI/frontend/src/components/layout/Header.tsx#L44) |
| **5** | **Signifiers** | Explicit visual signals that tell users *where* and *how* to interact. | Universal icons (`IconMapper.tsx`), slider thumbs, drag indicators, badge labels ("Active", "Setup needed", "Over Budget"), placeholder cues ("0", "e.g. Swiggy food"). | [`IconMapper.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/HCI/frontend/src/components/common/IconMapper.tsx), [`Dashboard.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/HCI/frontend/src/pages/Dashboard.tsx#L106-L109) |
| **6** | **Mappings** | The spatial or conceptual relationship between controls and their effects. | **Spatial Mapping:** Moving sliders right increases allocation, moving left decreases it. **Color Mapping:** Teal/Emerald = healthy savings, Amber = warning/caution, Rose/Red = expense/over-budget. **Currency:** Formatted using standard Indian Rupee notation (`en-IN`). | [`budgetUtils.ts`](file:///c:/Users/ASUS/OneDrive/Desktop/HCI/frontend/src/lib/budgetUtils.ts#L10-L18), [`BudgetPlanner.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/HCI/frontend/src/pages/BudgetPlanner.tsx#L55-L73) |
| **7** | **Constraints** | Restricting the possible actions to prevent errors and guide behavior. | **Physical/Range:** Slider inputs are clamped between ₹0 and `maxRange`. **Semantic Constraints:** Expense amounts must be strictly positive (`CHECK (amount > 0)`). **Temporal:** Target dates must conform to valid month-year dates. | [`supabase_schema.sql`](file:///c:/Users/ASUS/OneDrive/Desktop/HCI/supabase_schema.sql#L79), [`BudgetContext.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/HCI/frontend/src/context/BudgetContext.tsx#L513) |

---

## 2. Norman’s Model of Interaction (The 7 Stages of Action)

Norman’s interaction cycle breaks any human interaction into two critical gulfs: the **Gulf of Execution** and the **Gulf of Evaluation**.

```
                [ USER GOAL ]
         "Can I afford a ₹5,000 phone?"
                 /          \
                /            \
    [ GULF OF EXECUTION ]   [ GULF OF EVALUATION ]
    1. Plan                  5. Perceive state
    2. Specify action        6. Interpret state
    3. Execute action        7. Compare with goal
                \            /
                 \          /
             [ SPENDWISE SYSTEM ]
```

### The Seven Stages in SpendWise:
1. **Forming the Goal:** User wants to know: *"If I buy headphones for ₹3,000, will it ruin my semester trip savings?"*
2. **Forming the Intention:** Navigate to the What-If decision tool.
3. **Specifying an Action Sequence:** Click `What If?` → Select scenario *"Buy something new"* → Enter `₹3,000`.
4. **Executing the Action:** Click *"Simulate"* or adjust slider.
5. **Perceiving the State of the World:** The simulation card updates immediately, health gauge drops from 95 to 82, and a projected completion date badge shifts.
6. **Interpreting the Perceptions:** System displays: *"This purchase reduces available balance by 40% and delays your Semester Break Trip by 1 month."*
7. **Evaluating the Outcome Against the Goal:** User realizes the purchase delays their trip, deciding to hold off without ever corrupting their real database records.

* **Minimizing the Gulf of Execution:** SpendWise uses **Direct Manipulation** (sliders, one-click What-If templates) so the user doesn't have to write calculations or formulas.
* **Minimizing the Gulf of Evaluation:** SpendWise provides instant visual confirmation (Circular gauge, animated progress bars, plain-text impact statements).

---

## 3. Nielsen’s 10 Usability Heuristics with SpendWise Implementations

Jakob Nielsen’s 10 heuristics serve as the standard for user interface evaluation:

### 1. Visibility of System Status
* **In SpendWise:** Persistent global KPI summary banner displays Monthly Budget, Total Spent, Remaining Available Balance, and Current Savings. Real-time budget progress bars show exact percentages (e.g. `₹4,200 / ₹15,000 spent - 28%`).
* *File:* [`Dashboard.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/HCI/frontend/src/pages/Dashboard.tsx#L93-L140)

### 2. Match Between System and the Real World
* **In SpendWise:** The system speaks the language of a college student / young adult rather than database jargon. Categories include *Food & Canteen*, *Transport*, *Shopping*, *Entertainment*, and goals include *Coding Laptop* and *Semester Break Trip*. All amounts use standard Rupee (`₹`) symbols and comma notation (`₹15,000`).
* *File:* [`budgetUtils.ts`](file:///c:/Users/ASUS/OneDrive/Desktop/HCI/frontend/src/lib/budgetUtils.ts#L10-L18)

### 3. User Control and Freedom
* **In SpendWise:**
  * Modals provide prominent close (`X`) buttons and backdrop click dismissals.
  * A dedicated **"Reset Allocations"** button (`RotateCcw`) lets users discard changes and restore defaults.
  * The **What-If Simulator** acts as an unrestricted sandbox where users can test wild financial scenarios without altering real data.
* *File:* [`BudgetPlanner.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/HCI/frontend/src/pages/BudgetPlanner.tsx#L18), [`WhatIfSimulator.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/HCI/frontend/src/pages/WhatIfSimulator.tsx#L17)

### 4. Consistency and Standards
* **In SpendWise:** Standard web conventions: standard Lucide icons (Search, Plus, Trash, Edit, Settings), predictable left navigation on desktop, standard bottom tabs on mobile, standard form submission behaviors.
* *File:* [`Sidebar.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/HCI/frontend/src/components/layout/Sidebar.tsx), [`MobileNav.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/HCI/frontend/src/components/layout/MobileNav.tsx)

### 5. Error Prevention
* **In SpendWise:**
  * If slider distributions exceed the monthly budget limit, a bold red alert banner (`ShieldAlert`) informs the user immediately before saving.
  * Clamping slider inputs to `minRange` (₹0) and `maxRange` prevents negative numbers or arithmetic overflow.
  * Modal forms enforce validation (positive amount required, non-empty title/description).
* *File:* [`BudgetPlanner.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/HCI/frontend/src/pages/BudgetPlanner.tsx#L55-L65), [`BudgetContext.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/HCI/frontend/src/context/BudgetContext.tsx#L513-L516)

### 6. Recognition Rather than Recall
* **In SpendWise:**
  * Users do not need to remember what they spent last week: the Recent Expenses table displays full details, dates, and category icons.
  * In the AI Assistant, quick prompt chips (*"Can I afford a ₹5,000 purchase?"*, *"Where am I spending the most?"*) allow one-click querying.
  * The AI assistant automatically receives the user's live budget context from the backend, so users never need to recall and retype their numbers.
* *File:* [`Insights.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/HCI/frontend/src/pages/Insights.tsx#L298-L315)

### 7. Flexibility and Efficiency of Use
* **In SpendWise:**
  * Beginners can click suggested AI prompt chips and use visual sliders.
  * Experienced users can directly type numeric values into the budget input field, use date/category filters on the Expenses table, or interact via keyboard shortcuts.
* *File:* [`Expenses.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/HCI/frontend/src/pages/Expenses.tsx#L30-L70)

### 8. Aesthetic and Minimalist Design
* **In SpendWise:** Interface follows the "Less is More" principle. Cards use clean slate backgrounds, generous white space, subtle 1px borders, and progressive disclosure (clicking a category bar opens detailed breakdown rather than cluttering the initial view).
* *File:* [`Dashboard.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/HCI/frontend/src/pages/Dashboard.tsx#L274-L290)

### 9. Help Users Recognize, Diagnose, and Recover from Errors
* **In SpendWise:** Error messages avoid cryptic codes (e.g. `ERR_403`). Instead, clear human-readable alerts are shown:
  * *"Planned expenses exceed monthly budget by ₹2,000. Please adjust your sliders."*
  * *"Expense amount must be greater than zero."*
  * *"Password must be at least 6 characters long."*
* *File:* [`Auth.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/HCI/frontend/src/pages/Auth.tsx#L39-L42), [`BudgetPlanner.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/HCI/frontend/src/pages/BudgetPlanner.tsx#L55-L65)

### 10. Help and Documentation
* **In SpendWise:**
  * Interactive **Ask SpendWise Assistant** provides on-demand, contextual financial guidance grounded in live user data.
  * Informational badges and onboarding banners guide new accounts when no budget has been set yet.
* *File:* [`Insights.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/HCI/frontend/src/pages/Insights.tsx#L285-L378), [`Dashboard.tsx`](file:///c:/Users/ASUS/OneDrive/Desktop/HCI/frontend/src/pages/Dashboard.tsx#L93-L113)

---

## 4. Heuristic Evaluation Methodology

An expert inspection was conducted using Jakob Nielsen's severity rating scale:

| Severity Level | Definition | Example Identified & Resolved in SpendWise |
|---|---|---|
| **0** | Not a usability problem | Minor spacing alignment in timeline navigation. |
| **1** | Cosmetic problem only | Duplicate plus signs (`+ + Add Expense`) fixed to single icon + text label. |
| **2** | Minor usability problem | New user registration pre-filling legacy ₹15,000 data fixed to clean zero-state setup. |
| **3** | Major usability problem | Token refresh triggering `isLoadingData` which unmounted the page during AI chat fixed by decoupling session tokens from data loading states. |
| **4** | Usability catastrophe | Model 404/503 errors halting chat responses resolved with robust candidate fallback cascade. |

---

## 5. Contextual Inquiry (User Research)

Contextual Inquiry is a field-research method where designers observe and interview target users in their real environment.

### Target Audience:
* University students, interns, and early-career professionals (Ages 18–25) managing stipends, pocket money, or entry-level salaries in urban India.

### Key Contextual Insights:
1. **Mental Math Anxiety:** Users frequently hesitate before making mid-sized purchases (₹2,000–₹5,000) because they cannot quickly calculate how it affects their month-end rent or semester trip savings.
   * *SpendWise Solution:* Built the **What-If Decision Simulator** allowing risk-free hypothetical testing.
2. **Impulse UPI Spending:** Micro-transactions (tea, Swiggy snacks, rides) accumulate invisibly until budget exhaustion.
   * *SpendWise Solution:* Direct category spending comparison (`Planned vs Actual`) and visual progress bar alerts.
3. **Complex Traditional Spreadsheets:** Excel/Sheets are viewed as tedious, difficult to maintain on mobile, and lacking immediate visual feedback.
   * *SpendWise Solution:* Direct-manipulation sliders and single-gauge Health Score.

---

## 6. Cognitive Walkthrough

The Cognitive Walkthrough is a task-centric evaluation method evaluating how easy it is for a first-time user to accomplish a goal by answering 4 questions at each step:
1. *Will the user try to achieve the right effect?*
2. *Will the user notice that the correct action is available?*
3. *Will the user associate the correct action with the effect to be achieved?*
4. *If the correct action is performed, will the user see that progress is being made?*

### Example Walkthrough: Task — "Simulate buying a ₹5,000 Coding Device"

| Step | Action | Q1: Right effect? | Q2: Action noticed? | Q3: Action associated? | Q4: Progress visible? |
|---|---|---|---|---|---|
| **1** | Click *"Simulate Decisions"* banner on Dashboard | Yes (User wants to test a purchase) | Yes (Amber banner with "Interactive HCI Tool" badge) | Yes (Button text: "Launch Simulator") | Yes (Navigates immediately to `/simulator` view) |
| **2** | Select scenario template *"Buy something new (₹5,000)"* | Yes (Matches the exact intention) | Yes (Clear card with Shopping Bag icon) | Yes (Label clearly reads: "Buy something new (₹5,000)") | Yes (Card highlights with teal border and active badge) |
| **3** | Review simulation outcome metrics | Yes (User inspects impact on budget & savings) | Yes (Large impact card displays Health Score drop and new remaining balance) | Yes (Direct comparison with Baseline Plan cards above) | Yes (Clear message: *"Reduces available balance by ₹5,000 and drops health score"* without touching real data) |

---

## Summary for Academic Presentations & Viva

When presenting this project:
1. Highlight **Direct Manipulation** (Sliders) as the manifestation of Shneiderman's Rule 7 and Norman's Gulf of Execution reduction.
2. Demonstrate **Error Prevention** through the real-time Over-Budget Banner and the safe What-If Sandbox.
3. Showcase **Universal Usability** by toggling High Contrast and Colorblind modes in `Settings`.
4. Point evaluators to this document (`HCI_THEORETICAL_FRAMEWORK.md`) as proof of rigorous HCI syllabus compliance.
