import * as React from "react";
import { useRouter } from "next/router";
import { GetServerSidePropsContext, GetServerSidePropsResult } from "next";

type CookieType = {
  logged: boolean;
  [name: string]: any;
};

// Parses all available cookies associated with client browser.
function parseCookies(cookiesStr: string) {
  const cookieObj: CookieType = { logged: false };

  if (cookiesStr.length !== 0) {
    const cookies = cookiesStr.split("; ");

    cookies.forEach((cookie: any) => {
      const [key, value] = cookie.split("=");

      cookieObj[key] = key === "logged" ? Boolean(value) : value;
    });
  }

  return cookieObj;
}

async function getUserInfo(cookiesStr: string) {
  return parseCookies(cookiesStr);
}

// To ensure validation `logged` key must be available for headers cookies.
async function getLogged(context: GetServerSidePropsContext) {
  const userInfo: CookieType = { logged: false };

  const headerCookies = await getUserInfo(context.req.headers.cookie || "");

  return {
    ...userInfo,
    ...headerCookies,
  };
}

type OptionType = {
  redirectUri?: string; // Refers to: if not logged redirect to redirectUri
  authenticatedUri?: string; // Refers to: if logged redirect to authenticatedUri
  FallbackComponent?: React.ComponentType; // Refers to: if not logged in Component
  FeedbackComponent?: React.ComponentType; // Refers to: Loading / Redirecting component
};

// Props for withAuth from getServerSideProps must contain `logged` key
export const withAuth = (
  WrappedComponent: React.ComponentType,
  options?: OptionType
) => {
  return ({ logged, data }: { logged: boolean; data: any }) => {
    const router = useRouter();
    const redirectUri = options?.redirectUri;
    const authenticatedUri = options?.authenticatedUri;
    const FallbackComponent = options?.FallbackComponent;
    const FeedbackComponent = options?.FeedbackComponent;

    if (redirectUri && authenticatedUri) {
      throw new Error(
        "Both redirectUri and authenticatedUri mustn't be set at once."
      );
    }

    React.useEffect(() => {
      if (!logged && redirectUri) {
        router.push(redirectUri);
      } else if (logged && authenticatedUri) {
        router.push(authenticatedUri);
      }
    }, [logged, redirectUri]);

    if ((!logged && redirectUri) || (logged && authenticatedUri)) {
      return FeedbackComponent ? (
        <FeedbackComponent />
      ) : (
        <div>Redirecting...</div>
      );
    }

    if (!logged && FallbackComponent) {
      return <FallbackComponent />;
    }

    return <WrappedComponent {...data.props} />;
  };
};

// Attaching redirection paths in server-side
const attachRedirection = (
  targetObject: object,
  {
    redirectUri,
    authenticatedUri,
    logged,
  }: { redirectUri?: string; authenticatedUri?: string; logged: boolean }
) => {
  if (!logged && redirectUri) {
    targetObject["redirect"] = {
      destination: redirectUri,
      permanent: false,
    };
  } else if (logged && authenticatedUri) {
    targetObject["redirect"] = {
      destination: authenticatedUri,
      permanent: false,
    };
  }
};

// Callback function here acts as a `getServerSideProps` function
// If callback function is not passed, then it handles basic authentication
// only for `logged` key
// Callback function must return `logged` key as a prop.
// Callback function accepts `context` and `data` as first and second args.
// data contains all the available cookies in client browser with `logged` key (always).
export const withAuthServerSideProps = (
  options?: Pick<OptionType, "redirectUri" | "authenticatedUri">,
  getServerSideProps?: (
    context: GetServerSidePropsContext,
    cookieData: CookieType
  ) => any
) => {
  return async (context: GetServerSidePropsContext) => {
    const clientData: CookieType = await getLogged(context);
    const { logged, ...props } = clientData;

    // Redirection uris
    const redirectUri: string | undefined = options?.redirectUri;
    const authenticatedUri: string | undefined = options?.authenticatedUri;

    if (redirectUri && authenticatedUri) {
      throw new Error(
        "Both redirectUri and authenticatedUri mustn't be set at once."
      );
    }

    if (getServerSideProps) {
      const data = await getServerSideProps(context, clientData);

      if (!data) {
        throw new Error(`Callback function cannot return ${data}`);
      }

      if (!data.props) {
        throw new Error("Callback function must return props");
      }

      const returnObject: GetServerSidePropsResult<any> = {
        props: {
          logged,
          data,
        },
      };
      attachRedirection(returnObject, {
        logged,
        redirectUri,
        authenticatedUri,
      });
      return returnObject;
    }

    // If callback is not passed create a `props` key for WrappedComponent
    const returnObject: GetServerSidePropsResult<any> = {
      props: {
        logged,
        data: {
          props: {
            logged,
            ...props,
          },
        },
      },
    };
    attachRedirection(returnObject, { logged, redirectUri, authenticatedUri });
    return returnObject;
  };
};
