type IconProps = React.HTMLAttributes<SVGElement>;

export const Icons = {
  logo: (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" {...props}>
      <rect width="100" height="100" fill="none" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M75.55 53.1221C74.12 72.8501 58.861 88.3971 40.275 88.3971C21.689 88.3971 6.431 72.8501 5 53.1221C7.929 71.3381 22.618 85.2051 40.275 85.2051C57.932 85.2051 72.621 71.3381 75.55 53.1221Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M34.5685 70.6489C18.1985 59.5459 12.3645 38.5579 21.6575 22.4619C30.9505 6.36592 52.0435 0.924918 69.8435 9.55092C52.6035 2.97892 33.2505 8.76692 24.4215 24.0579C15.5935 39.3499 20.2575 59.0039 34.5685 70.6489Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M60.1189 73.7162C42.3189 82.3412 21.2259 76.9002 11.9329 60.8042C2.63988 44.7082 8.47388 23.7202 24.8439 12.6172C10.5329 24.2622 5.86888 43.9162 14.6969 59.2082C23.5259 74.4992 42.8789 80.2872 60.1189 73.7162Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M24.4492 46.9889C25.8792 27.2599 41.1382 11.7139 59.7242 11.7139C78.3102 11.7139 93.5682 27.2599 94.9992 46.9889C92.0702 28.7719 77.3812 14.9059 59.7242 14.9059C42.0672 14.9059 27.3782 28.7719 24.4492 46.9889Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M65.4313 29.3511C81.8013 40.4541 87.6353 61.4421 78.3423 77.5381C69.0493 93.6341 47.9562 99.0751 30.1562 90.4491C47.3962 97.0211 66.7493 91.2331 75.5783 75.9421C84.4063 60.6501 79.7423 40.9961 65.4313 29.3511Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M39.8809 26.3952C57.6809 17.7702 78.7739 23.2102 88.0669 39.3062C97.3599 55.4022 91.5259 76.3902 75.1559 87.4932C89.4669 75.8492 94.1309 56.1942 85.3029 40.9022C76.4739 25.6112 57.1209 19.8232 39.8809 26.3952Z"
        fill="currentColor"
      />
    </svg>
  ),
  spinner: (props: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  ),
};
