// src/
// ├── api/
// │   ├── client.ts              # axios instance + interceptors (auth header, token refresh)
// │   ├── auth.api.ts            # login, logout, verify, accesstoken, isloggedin
// │   ├── users.api.ts           # createuser, getusers
// │   ├── organizations.api.ts   # create org, create group, get org users
// │   ├── courses.api.ts         # course/chapter/quiz/question/enroll endpoints
// │   └── analytics.api.ts       # dashboard, course overview
// │
// ├── features/
// │   ├── auth/
// │   │   ├── LoginPage.tsx
// │   │   ├── VerifyOtpPage.tsx
// │   │   ├── useAuth.ts          # wraps AuthContext for convenience
// │   │   └── AuthContext.tsx     # { user, role, accessToken, login(), logout() }
// │   │
// │   ├── dashboard/
// │   │   ├── DashboardPage.tsx
// │   │   ├── useDashboardAnalytics.ts   # useQuery wrapping /api/analytics/dashboard
// │   │   └── components/
// │   │       ├── StatCard.tsx
// │   │       └── CompletionChart.tsx
// │   │
// │   ├── organizations/
// │   │   ├── OrganizationsPage.tsx      # superadmin: create org
// │   │   ├── CreateOrgForm.tsx
// │   │   ├── GroupsPage.tsx             # admin: create group
// │   │   └── useOrganizations.ts        # useQuery/useMutation hooks
// │   │
// │   ├── users/
// │   │   ├── UsersListPage.tsx          # paginated table
// │   │   ├── CreateUsersForm.tsx        # bulk create (matches validateMultiple)
// │   │   └── useUsers.ts
// │   │
// │   └── courses/
// │       ├── CourseListPage.tsx
// │       ├── CourseDetailPage.tsx       # chapters, quizzes, questions
// │       ├── CourseOverviewPage.tsx     # per-course analytics
// │       ├── EnrollModal.tsx            # single user or whole group
// │       ├── CreateCourseForm.tsx
// │       ├── CreateChapterForm.tsx
// │       └── useCourses.ts
// │
// ├── components/                # shared, dumb UI components (Button, Table, Modal, Pagination)
// │   ├── ui/
// │   └── layout/
// │       ├── AppShell.tsx       # sidebar/topbar wrapper
// │       └── ProtectedLayout.tsx
// │
// ├── routes/
// │   ├── router.tsx             # createBrowserRouter config
// │   └── RoleGuard.tsx          # <RoleGuard allow={["admin","superadmin"]}>
// │
// ├── types/
// │   ├── auth.types.ts
// │   ├── user.types.ts
// │   ├── course.types.ts
// │   └── organization.types.ts   # mirror your backend's src/types/*.ts — keep them in sync
// │
// ├── lib/
// │   └── queryClient.ts          # TanStack Query client config
// │
// ├── App.tsx
// └── main.tsx