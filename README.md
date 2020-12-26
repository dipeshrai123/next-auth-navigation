# Next Auth Navigation

> NextJS Library for authentication

[![NPM](https://shields.io/npm/v/next-auth-navigation.svg)](https://www.npmjs.com/package/react-auth-navigation) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
// with npm
npm i next-auth-navigation

// with yarn
yarn add next-auth-navigation
```

## Why is next-auth-navigation ?

It is a NextJS Library for user authentication in client / server side. It provides basic HOC's that to wrap around pages to authenticate user very easily.

## Usage

### Authentication

**next-auth-navigation** only provides 2 helpful hocs to define user authentication in client / server side. Both hocs must be used for authentication.

- **withAuth()** and
- **withAuthServerSideProps()**

#### withAuth(_Component_, _options?_)

**withAuth()** accepts a _component_ for which we wan an authentication as a first argument and _options_ as a second argument. _options_

Let us configure the _second argument_.

- **redirectUri** _( optional )_ : If the user is not logged in, user is redirected to path assigned in _redirectUri_.
- **authenticatedUri** _( optional )_ : If the user is logged in, user is redirected to path assigned in _authenticatedUri_.
- **FallbackComponent** _( optional )_ : If the user is not logged in, Fallback component is shown on a page.
- **FeedbackComponent** _( optional )_ : Feedback component is shown when redirecting either on _redirectUri_ or _authenticatedUri_.

#### withAuthServerSideProps(_options?_, _callback?_)

**withAuthServerSideProps()** is used instead of **getServerSideProps()** function on a page with **withAuth()** hoc. It is used to authenticate user in server-side. **options** is passed as a first optional argument where we can specify _redirectUri_ or _authenticatedUri_ for server-side redirection. **callback** function can be provided as second argument which acts as a **getServerSideProps()** function with _context_ as a first argument and _data_ as a second argument reffering all _cookie data_.

**Example**

```javascript
import { withAuth, withAuthServerSideProps } from "next-auth-navigation";
function Home() {
  return <div>HOME PAGE</div>;
}

export default withAuth(Home, {
  redirectUri: "/login",
});

export const getServerSideProps = withAuthServerSideProps();
```

## License

MIT © [dipeshrai123](https://github.com/dipeshrai123)
