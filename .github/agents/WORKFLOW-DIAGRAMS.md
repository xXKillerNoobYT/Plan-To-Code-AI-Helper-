# Copilot Agent Personas - Visual Workflow

**Mermaid diagrams showing how Copilot agents coordinate during development**

---

## 🔄 Complete Feature Implementation Workflow

```mermaid
sequenceDiagram
    participant User
    participant AnswerAgent as @answer-agent
    participant CodingAgent as @coding-agent
    participant VerificationAgent as @verification-agent
    participant MCP as MCP Server

    User->>AnswerAgent: What are the requirements for feature X?
    AnswerAgent->>AnswerAgent: Search PRD.json
    AnswerAgent->>AnswerAgent: Check Plans/
    AnswerAgent-->>User: Acceptance criteria (Source: PRD.json F028)
    
    User->>CodingAgent: Implement feature X
    CodingAgent->>AnswerAgent: askQuestion: How to handle edge case?
    AnswerAgent-->>CodingAgent: Answer from PRD
    CodingAgent->>CodingAgent: Implement code + tests
    CodingAgent->>MCP: reportTaskStatus(inProgress)
    CodingAgent-->>User: Implementation complete
    
    User->>VerificationAgent: Verify implementation
    VerificationAgent->>VerificationAgent: Wait 60s for file stability
    VerificationAgent->>VerificationAgent: Run tests
    VerificationAgent->>VerificationAgent: Compare to PRD
    VerificationAgent->>MCP: reportVerificationResult(PASS/FAIL)
    
    alt Verification PASS
        VerificationAgent-->>User: ✅ PASS - All criteria met
    else Verification FAIL
        VerificationAgent-->>User: ❌ FAIL - See report
        User->>CodingAgent: Fix issues
        CodingAgent->>CodingAgent: Apply fixes
        CodingAgent-->>User: Fixes applied
        User->>VerificationAgent: Re-verify
    end
```

---

## 🎯 Agent Decision Flow

```mermaid
flowchart TD
    Start([User Request]) --> Question{What's the task?}
    
    Question -->|Need information| AnswerAgent[@answer-agent]
    Question -->|Build/implement| CodingAgent[@coding-agent]
    Question -->|Check quality| VerificationAgent[@verification-agent]
    
    AnswerAgent --> SearchPRD[Search PRD.json]
    SearchPRD --> SearchPlans[Search Plans/]
    SearchPlans --> Found{Answer found?}
    Found -->|Yes| ReturnAnswer[Return answer <5s with sources]
    Found -->|No| Escalate[Escalate to Planning Team]
    ReturnAnswer --> End([Done])
    Escalate --> End
    
    CodingAgent --> ReadPRD[Read PRD for specs]
    ReadPRD --> Uncertain{≥5% uncertain?}
    Uncertain -->|Yes| AskQuestion[Call askQuestion MCP tool]
    Uncertain -->|No| Implement[Implement code]
    AskQuestion --> AnswerAgent
    Implement --> WriteTests[Write tests]
    WriteTests --> Report[reportTaskStatus completed]
    Report --> End
    
    VerificationAgent --> Wait[Wait 60s for stability]
    Wait --> RunTests[Run all test suites]
    RunTests --> ComparePlan[Compare to PRD]
    ComparePlan --> Result{All pass?}
    Result -->|Yes| PassResult[reportVerificationResult PASS]
    Result -->|No| FailResult[reportVerificationResult FAIL]
    Result -->|Partial| PartialResult[reportVerificationResult PARTIAL]
    PassResult --> End
    FailResult --> BackToCoding[Send back to @coding-agent]
    PartialResult --> BackToCoding
    BackToCoding --> CodingAgent
```

---

## 🔀 Agent Coordination Patterns

### Pattern 1: Simple Implementation

```mermaid
graph LR
    A[User: @coding-agent implement X] --> B[@coding-agent]
    B --> C[Read PRD]
    C --> D[Implement + Tests]
    D --> E[reportTaskStatus]
    E --> F[Done]
```

### Pattern 2: Implementation with Questions

```mermaid
graph LR
    A[User: @coding-agent implement X] --> B[@coding-agent]
    B --> C[Read PRD]
    C --> D{Uncertain?}
    D -->|Yes| E[@answer-agent via askQuestion]
    E --> F[Get clarification]
    F --> G[Implement + Tests]
    D -->|No| G
    G --> H[Done]
```

### Pattern 3: Full Cycle with Verification

```mermaid
graph TD
    A[User: @coding-agent implement X] --> B[@coding-agent]
    B --> C[Implement + Tests]
    C --> D[User: @verification-agent verify]
    D --> E[@verification-agent]
    E --> F{Result}
    F -->|PASS| G[✅ Done]
    F -->|FAIL| H[Back to @coding-agent]
    H --> I[@coding-agent fix]
    I --> E
```

---

## 🧠 Agent Communication via MCP Tools

```mermaid
sequenceDiagram
    participant CA as @coding-agent
    participant MCP as MCP Server
    participant AA as @answer-agent
    participant VA as @verification-agent
    participant Orch as Programming Orchestrator

    CA->>MCP: getNextTask()
    MCP-->>CA: Task with super-detailed prompt
    
    CA->>CA: Start implementation
    CA->>MCP: reportTaskStatus(inProgress)
    MCP-->>Orch: Status update
    
    CA->>MCP: askQuestion(context)
    MCP->>AA: Route to Answer Team
    AA->>AA: Search PRD/Plans
    AA-->>MCP: Answer with sources
    MCP-->>CA: Clarification received
    
    CA->>CA: Complete implementation
    CA->>MCP: reportTaskStatus(completed)
    MCP-->>Orch: Task completed
    
    Orch->>VA: Trigger verification
    VA->>VA: Wait 60s + Run tests
    VA->>MCP: reportVerificationResult(PASS/FAIL)
    MCP-->>Orch: Verification complete
```

---

## 📊 Agent Responsibility Matrix

```mermaid
graph TB
    subgraph "User Requests"
        R1[Implement Feature]
        R2[Ask Question]
        R3[Verify Code]
    end
    
    subgraph "@coding-agent"
        C1[Read PRD]
        C2[Ask if uncertain]
        C3[Implement code]
        C4[Write tests]
        C5[Report status]
    end
    
    subgraph "@answer-agent"
        A1[Search PRD]
        A2[Search Plans]
        A3[Return answer <5s]
        A4[Escalate complex]
    end
    
    subgraph "@verification-agent"
        V1[Wait for stability]
        V2[Run tests]
        V3[Compare to plan]
        V4[Report result]
    end
    
    R1 --> C1
    C1 --> C2
    C2 --> A1
    C3 --> C4
    C4 --> C5
    
    R2 --> A1
    A1 --> A2
    A2 --> A3
    A3 --> A4
    
    R3 --> V1
    V1 --> V2
    V2 --> V3
    V3 --> V4
```

---

## ⚡ Agent Response Time Comparison

```mermaid
gantt
    title Agent Response Times
    dateFormat  ss
    section @answer-agent
    Simple question     :done, a1, 00, 3s
    Moderate question   :done, a2, 03, 8s
    Complex question    :done, a3, 11, 15s
    
    section @coding-agent
    Implement feature   :active, c1, 00, 45m
    
    section @verification-agent
    File stability wait :crit, v1, 00, 60s
    Run tests           :active, v2, 60, 120s
    Generate report     :done, v3, 180, 60s
```

---

## 🎭 Agent Persona Switching

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> CodingMode: @coding-agent invoked
    Idle --> VerificationMode: @verification-agent invoked
    Idle --> AnswerMode: @answer-agent invoked
    
    CodingMode --> QuestionMode: Need clarification
    QuestionMode --> AnswerMode: askQuestion tool
    AnswerMode --> CodingMode: Answer received
    CodingMode --> VerificationMode: Implementation complete
    
    VerificationMode --> CodingMode: FAIL - needs fixes
    VerificationMode --> Idle: PASS - complete
    
    AnswerMode --> Idle: Answer provided
    AnswerMode --> Escalated: Complex question
    Escalated --> Idle: Human/Planning Team answers
```

---

## 🔄 Iterative Development Cycle

```mermaid
flowchart TD
    Start([New Feature Request]) --> Q1[@answer-agent: What are requirements?]
    Q1 --> Impl[@coding-agent: Implement]
    Impl --> Verify[@verification-agent: Verify]
    
    Verify --> Check{Result?}
    Check -->|PASS| Done([✅ Complete])
    Check -->|FAIL| Fix[@coding-agent: Fix issues]
    Check -->|PARTIAL| Enhance[@coding-agent: Add missing parts]
    
    Fix --> Verify
    Enhance --> Verify
    
    style Done fill:#90EE90
    style Check fill:#FFD700
    style Fix fill:#FFB6C1
    style Enhance fill:#87CEEB
```

---

## 📋 Agent Priority Handling

```mermaid
flowchart LR
    subgraph "Priority-Aware Agents"
        direction TB
        P1[P1 Task: Critical]
        P2[P2 Task: High]
        P3[P3 Task: Medium]
    end
    
    P1 --> CA1[@coding-agent]
    CA1 --> Strict1[Zero warnings required]
    Strict1 --> VA1[@verification-agent]
    VA1 --> Cov1[90% coverage threshold]
    
    P2 --> CA2[@coding-agent]
    CA2 --> Moderate2[≤5 warnings allowed]
    Moderate2 --> VA2[@verification-agent]
    VA2 --> Cov2[80% coverage threshold]
    
    P3 --> CA3[@coding-agent]
    CA3 --> Lenient3[≤10 warnings allowed]
    Lenient3 --> VA3[@verification-agent]
    VA3 --> Cov3[75% coverage threshold]
    
    style P1 fill:#FF6B6B
    style P2 fill:#FFA500
    style P3 fill:#4ECDC4
```

---

## 🎯 Real-World Example: getNextTask Implementation

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant AA as @answer-agent
    participant CA as @coding-agent
    participant VA as @verification-agent
    participant MCP as MCP Server

    User->>AA: What are acceptance criteria for F028?
    AA->>AA: Search PRD.json features[27]
    AA-->>User: 1) Returns P1 task<br/>2) Super-detailed prompt<br/>3) Handles empty queue
    
    User->>CA: Implement getNextTask MCP tool
    CA->>CA: Read PRD.json F028
    CA->>CA: Check Plans/05-MCP-API-Reference.md
    
    Note over CA: Uncertain about error handling
    CA->>MCP: askQuestion("Return null or throw on empty?")
    MCP->>AA: Route question
    AA->>AA: Search PRD
    AA-->>MCP: "Return null (PRD.json F028 criteria #3)"
    MCP-->>CA: Answer received
    
    CA->>CA: Implement src/mcpServer/tools.ts
    CA->>CA: Write tests __tests__/tools.test.ts
    CA->>MCP: reportTaskStatus(completed)
    
    User->>VA: Verify getNextTask
    VA->>VA: Wait 60s for stability
    VA->>VA: Run npm test
    VA->>VA: Check coverage: 92%
    VA->>VA: Compare to PRD: All ✅
    VA->>MCP: reportVerificationResult(PASS)
    VA-->>User: ✅ PASS - Coverage 92%, All criteria met
```

---

## 🔍 Agent Internal Workflow Details

### @coding-agent Internal Flow

```mermaid
flowchart TD
    Start([Task assigned]) --> Check1{Read PRD}
    Check1 --> Check2{Atomic?<br/>5 criteria}
    Check2 -->|No| Decompose[Request task split]
    Check2 -->|Yes| Uncertain{≥5% uncertain?}
    
    Uncertain -->|Yes| Ask[askQuestion MCP tool]
    Ask --> WaitAnswer[Wait for answer]
    WaitAnswer --> Implement
    Uncertain -->|No| Implement[Implement code]
    
    Implement --> Tests[Write tests]
    Tests --> Lint[Run linting]
    Lint --> CheckCov{Coverage ≥80%?}
    CheckCov -->|No| MoreTests[Add more tests]
    MoreTests --> CheckCov
    CheckCov -->|Yes| Report[reportTaskStatus completed]
    Report --> End([Done])
    
    Decompose --> End
```

### @verification-agent Internal Flow

```mermaid
flowchart TD
    Start([Verification requested]) --> Wait[Wait 60s]
    Wait --> Monitor{Files still changing?}
    Monitor -->|Yes| ResetTimer[Reset timer]
    ResetTimer --> Wait
    Monitor -->|No| ExtractReq[Extract requirements from PRD]
    
    ExtractReq --> RunUnit[Run unit tests]
    RunUnit --> RunInt[Run integration tests]
    RunInt --> RunLint[Run linting]
    RunLint --> RunType[Run type checking]
    
    RunType --> CalcCov[Calculate coverage]
    CalcCov --> CheckPriority{Task priority?}
    
    CheckPriority -->|P1| Threshold1{Coverage ≥90%?}
    CheckPriority -->|P2| Threshold2{Coverage ≥80%?}
    CheckPriority -->|P3| Threshold3{Coverage ≥75%?}
    
    Threshold1 -->|No| Fail
    Threshold2 -->|No| Fail
    Threshold3 -->|No| Fail
    
    Threshold1 -->|Yes| MapReq
    Threshold2 -->|Yes| MapReq
    Threshold3 -->|Yes| MapReq
    
    MapReq[Map requirements to code] --> Gaps{Any gaps?}
    Gaps -->|Yes| Partial[Result: PARTIAL]
    Gaps -->|No| Pass[Result: PASS]
    
    Pass --> Report[reportVerificationResult]
    Partial --> Report
    Fail[Result: FAIL] --> Report
    Report --> End([Done])
```

### @answer-agent Internal Flow

```mermaid
flowchart TD
    Start([Question received]) --> Classify{Question complexity?}
    
    Classify -->|Simple| Budget1[Time budget: 3s]
    Classify -->|Moderate| Budget2[Time budget: 8s]
    Classify -->|Complex| Budget3[Time budget: 15s]
    Classify -->|Architectural| Escalate[Immediate escalation]
    
    Budget1 --> Stage1[Search PRD.json]
    Budget2 --> Stage1
    Budget3 --> Stage1
    
    Stage1 --> Found1{Found?}
    Found1 -->|Yes| Confidence{Confidence ≥70%?}
    Found1 -->|No| Stage2[Search Plans/]
    
    Stage2 --> Found2{Found?}
    Found2 -->|Yes| Confidence
    Found2 -->|No| Stage3[Search Code]
    
    Stage3 --> Found3{Found?}
    Found3 -->|Yes| Confidence
    Found3 -->|No| Escalate
    
    Confidence -->|Yes| Format[Format answer with sources]
    Confidence -->|No| Escalate
    
    Format --> Return[Return answer]
    Escalate --> Route[Route to Planning Team]
    
    Return --> End([Done])
    Route --> End
```

---

## 📈 Agent Performance Metrics Dashboard

```mermaid
pie title Agent Usage Distribution (Typical Sprint)
    "@coding-agent": 60
    "@verification-agent": 25
    "@answer-agent": 15
```

```mermaid
pie title Verification Results Distribution
    "PASS": 70
    "PARTIAL": 20
    "FAIL": 10
```

---

## 🎬 End-to-End Feature Example

```mermaid
journey
    title Implementing a P1 Feature (getNextTask)
    section Requirements
      Ask about criteria: 5: @answer-agent
      Understand PRD: 5: User
    section Implementation
      Read PRD: 4: @coding-agent
      Ask clarification: 5: @coding-agent, @answer-agent
      Implement code: 4: @coding-agent
      Write tests: 4: @coding-agent
    section Verification
      Wait for stability: 3: @verification-agent
      Run tests: 5: @verification-agent
      Check coverage: 5: @verification-agent
      Compare to plan: 5: @verification-agent
    section Completion
      Review report: 5: User
      Mark complete: 5: User
```

---

**Note**: These diagrams are written in Mermaid syntax and will render in:
- GitHub (in .md files)
- VS Code (with Mermaid extension)
- Markdown preview tools

To view, paste the Mermaid code blocks into [Mermaid Live Editor](https://mermaid.live/) or use a Markdown viewer that supports Mermaid.

---

**Version**: 1.0.0  
**Last Updated**: January 24, 2026
