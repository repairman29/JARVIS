# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - link "🫒 Olive" [ref=e4] [cursor=pointer]:
        - /url: /
        - generic [ref=e6]: 🫒
        - generic [ref=e7]: Olive
      - generic [ref=e8]:
        - heading "Welcome back" [level=2] [ref=e9]
        - paragraph [ref=e10]: Olive's been keeping things tidy
        - generic [ref=e11]: We'll connect your Kroger account after you sign in.
        - generic [ref=e12]:
          - generic [ref=e13]:
            - generic [ref=e14]: Email
            - textbox "you@example.com" [ref=e15]: olive-e2e-test@example.com
          - generic [ref=e16]:
            - generic [ref=e17]: Password
            - textbox "••••••••" [ref=e18]: TestPassword123!
          - generic [ref=e19]: Invalid API key
          - button "Sign In" [ref=e20]
        - button "New here? Create an account" [ref=e22]
        - link "🛒 Continue with Kroger (sign in first)" [ref=e24] [cursor=pointer]:
          - /url: /login?then=connect
          - generic [ref=e25]: 🛒
          - generic [ref=e26]: Continue with Kroger
          - generic [ref=e27]: (sign in first)
  - button "Open Next.js Dev Tools" [ref=e33] [cursor=pointer]:
    - img [ref=e34]
  - alert [ref=e37]
```