import * as React from "react";
import { useRouter } from "next/router";

function parseCookies(cookiesStr: any) {
  if (cookiesStr.length !== 0) {
    const cookies = cookiesStr.split("; ");

    const cookieObj = {};
    cookies.forEach((cookie: any) => {
      const [key, value] = cookie.split("=");

      cookieObj[key] = isNaN(value)
        ? value === "true"
          ? true
          : value === "false"
          ? false
          : value
        : Number(value);
    });

    return cookieObj;
  }
  return null;
}

async function getUserInfo(cookiesStr: string) {
  return parseCookies(cookiesStr);
}

// To ensure validation `logged` key must be available for headers cookies.
async function getLogged(context: any) {
  let userInfo: any = null;

  try {
    userInfo = await getUserInfo(context.req.headers.cookie || "");
  } catch {
    userInfo = null;
  }

  if (userInfo) {
    const { logged, ...props } = userInfo;

    return {
      logged,
      ...props,
    };
  } else {
    return {
      logged: false,
    };
  }
}

// Props for withAuth from getServerSideProps must contain `logged` key
export const withAuth = (
  WrappedComponent: React.ComponentType,
  options?: {
    redirectUri?: string; // Referes to: if not logged in uri
    FallbackComponent?: React.ComponentType; // Referes to: if not logged in Component
  }
) => {
  return ({ logged, data }: { logged: any; data: any }) => {
    const router = useRouter();
    const redirectUri = options?.redirectUri;
    const FallbackComponent = options?.FallbackComponent;

    React.useEffect(() => {
      if (!logged && redirectUri) {
        router.push(redirectUri);
      }
    }, [logged, redirectUri]);

    if (!logged && redirectUri) {
      return <div>Redirecting...</div>;
    }

    if (!logged && FallbackComponent) {
      return <FallbackComponent />;
    }

    return <WrappedComponent {...data.props} />;
  };
};

// Callback function here acts as a `getServerSideProps` function
// If callback function is not passed, then it handles basic authentication
// only for `logged` key
// Callback function must return `logged` key as a prop.
export const withAuthServerSideProps = (
  getServerSideProps: (context: any, data: any) => any
) => {
  return async (context: any) => {
    const clientData = await getLogged(context);
    const { logged, ...props } = clientData;

    if (getServerSideProps) {
      const { logged, data } = await getServerSideProps(context, clientData);

      if (!data) {
        throw new Error(`Callback function cannot return ${data}`);
      }

      if (!data.props) {
        throw new Error("Callback function must return props");
      }

      return {
        props: {
          logged,
          data,
        },
      };
    }

    return {
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
  };
};
