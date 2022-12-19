module.exports = {
    InternalServerError: { code: 1001, message: "Something went wrong!" },
    UserRegistrationSuccess: { code: 200, message: "Register Successfully." },
    BannerDataUpdateFailed: {
        code: 1005,
        message: "Failed to update banner data details. Please try after sometime."
    },
    ForgotPassword: { code: 200, message: "OTP Send to your registerd email Id." },
    EmailVerified: { code: 200, message: "your email is not verified please verified your email" },
    NoBannerFound: { code: 1006, message: "No BannerData found." },
    OTPVerifyFail: {
        code: 1010,
        message: "OTP verification failed."
    },
    OTPExpired: {
        code: 1010,
        message: "OTP is expire."
    },
    UserUpdateFail: { code: 1010, message: "Failed to update user details. Please try after sometime. " },
    ForgotPassword: { code: 200, message: "OTP Send to your registerd email Id." },
    PasswordChangeSucess: { code: 200, message: "Password has been updated" },
    bannerDataSuccess: {
        code: 200,
        message: "banner Data Save Successfully"
    },
    roleTypetInsertFail: {
        code: 1005,
        message: "Failed to insert role Details. Please try after sometime."
    },
    bannerDataAllReadyExist: {
        code: 1010,
        message: "banner Data already Exist"
    },
    UserUpdateFailed: {
        code: 1005,
        message: "Failed to update user details. Please try after sometime."
    },
    AllreadyExist: {
        code: 1005,
        message: "already exist."
    },
    allReadyadded
    : {
        code: 1005,
        message: "already added to favoriteList."
    },
    NoseshTypeFound: { code: 1006, message: "No seshType found" },
    NoSparesFound: { code: 1010, message: "No spares  data found" },
    NoSpareModelFound: { code: 1010, message: "No spare model  data found" },
    NoserviceFound: { code: 1010, message: "No service  data found" },
    NotFound: { code: 1010, message: "Not found" },
    NoBlogDataFound: { code: 1010, message: "No blog data found" },
    NoUserFound: { code: 1006, message: "No user found." },
    NoServiceFound: { code: 1006, message: "No service found." },
    NosparesFound: { code: 1006, message: "No spares found." },
    NoNewsFound: { code: 1006, message: "No News found." },
    NoSeshtypeFound: { code: 1006, message: "No seshType found." },
    InvalidCredential: { code: 1007, message: "Invalid username or password." },
    InvalidOldPassword: { code: 1007, message: "Invalid old password." },
    LoginSuccess: { code: 200, message: "Login successfully." },
    LoginAgain: { code: 200, message: "Please login." },
    PleaseLoginAgain: { code: 1014, message: "Please login." },
    Success: { code: 200, message: "Success." },
    Fail: { code: 1010, message: "Fail....." },
    ExistUser: { code: 1011, message: "Mobile number already exist." },
    yourPaymentAlreadyDone: { code: 1011, message: "your paid amount is more than remaining amount" },
    ExistBookNowId: { code: 1011, message: "Your Order already exist." },
    ExistUserName: { code: 1011, message: "User Name not available." },
    ExistSlugName: { code: 1011, message: "Slug Name not available." },
    ExistEmail: { code: 1011, message: "Email is already exist." },
    ExistMobile: { code: 1011, message: "Mobile is already exist." },
    UserNotActivated: { code: 1012, message: "User is not activated yet." },
    SomethingWrong: { code: 1013, message: "Oops! something went wrong, please try again later." },
    MissingDeviceTokenParameter: { code: 1015, message: "Missing device token parameters." },
    SubsciptionPlanExist: { code: 1011, message: "SubScription Plan Exist, Deactivate previous plan" },
}
