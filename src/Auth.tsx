import * as React from "react";

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
export const withAuth = (WrappedComponent: React.ComponentType) => {
  return ({ logged, data }: { logged: any; data: any }) => {
    if (!logged) {
      return <div>Not logged</div>;
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
    const { logged, ...props } = await getLogged(context);

    if (getServerSideProps) {
      const data = await getServerSideProps(context, {
        logged,
        ...props,
      });

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
