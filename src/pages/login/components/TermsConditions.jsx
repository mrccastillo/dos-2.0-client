import "../stylesheets/TC.css";

function TermsConditions({ onCloseModal }) {
  return (
    <div className="terms-conditions">
      <h2
        style={{
          paddingBottom: "1rem",
          borderBottom: "1px solid rgb(0, 0, 0, 0.2)",
        }}
      >
        Terms and Conditions
      </h2>
      <div className="tc-container">
        <p style={{ fontSize: "0.9rem" }}>
          Terms and Conditions
          <br />
          Welcome to DOS,a mini social media platform for PUPSHS Students!
          <br />
          <br />
          Acceptance of Terms By using DOS, you agree to be bound by these terms
          and conditions. If you do not agree to these terms and conditions,
          please do not use our platform.
          <br />
          <br />
          User Conduct You agree to use our platform in a responsible and
          respectful manner. This includes but is not limited to: Using your
          First/Nickname and Lastname when signing up. Being respectful of other
          users and their opinions. Refraining from posting any content that is
          illegal, offensive, or discriminatory. Refraining from using our
          platform to harass or bully others.
          <br />
          <br />
          User Guidelines
          <br />
          We want DOS to be a safe and respectful space for everyone, so we ask
          that you use it responsibly. This means that when you post or create
          an announcement, please keep the following in mind: Only post
          announcements that are relevant. This will help keep the community
          focused and engaged. When you make posts, we won't be too strict about
          what you share, since we want you to be able to express your thoughts
          and feelings. However, please be mindful of how your posts may affect
          others. We don't allow bullying or harassment of any kind. By
          following these guidelines, we can all help create a welcoming and
          positive environment for everyone to enjoy. Thank you for your
          cooperation!
          <br />
          <br />
          Content Ownership and Use
          <br /> All content uploaded to the platform, including but not limited
          to text, graphics, photos, is the property of the user who uploaded
          it. By uploading content to the platform, you grant our platform a
          non-exclusive, royalty-free, perpetual, irrevocable, and fully
          sublicensable right to use, reproduce, modify, adapt, publish,
          translate, create derivative works from, distribute, perform, and
          display such content in whole or in part worldwide and/or to
          incorporate it in other works in any form, media, or technology now
          known or later developed.
          <br />
          <br />
          Data Privacy
          <br />
          We are committed to protecting your privacy and the privacy of other
          users. We collect and use personal data in accordance with our Privacy
          Policy. One of our expectations for user conduct is to use your
          first/nickaname & lastname when signing up. We value your privacy;
          however, using your name will help us and other users to recognize
          you. It is also a precaution to held you responsible when you violate
          our terms and conditions.
          <br />
          <br />
          User Accounts To use our platform, you may be required to create an
          account. You are responsible for maintaining the confidentiality of
          your account login information, and you are solely responsible for all
          activities that occur under your account. You agree to notify us
          immediately of any unauthorized use of your account or any other
          breach of security.
          <br />
          <br />
          Termination and Suspension
          <br /> We may suspend or terminate your account at any time, with or
          without notice, for any reason, including but not limited to a
          violation of our policies or these terms and conditions. However, as
          your fellow PUPSHS Student, we believe in providing fair notice before
          taking such actions. If we decided to suspend or terminate your
          account, we will send a notification to your DOS account prior to the
          suspension or termination. This notification will be highlighted in
          red so that you can easily distinguish it from other notifications.
          This will also be the location where we send you a warning or notice
          if you violated our terms and conditions.
          <br />
          <br />
          Changes to Terms and Conditions <br />
          We may modify these terms and conditions at any time, in our sole
          discretion, without prior notice to you. Your continued use of our
          platform after the modification of these terms and conditions
          constitutes your acceptance of the modified terms and conditions.
          <br />
          <br />
          Content Moderation
          <br />
          For any posts or announcements that violate our terms and conditions,
          they will be immediately removed after a dev notices it. Additionally,
          we will send a warning directly to your account notifying you of the
          removal.
          <br />
          <br />
          --------------------------------------------------------------------------------------------------------------------------------------------------------------------------
          <br />
          <br />
          Dear users, We greatly appreciate your support in using DOS. As with
          any new software, we understand that bugs can arise despite our best
          efforts to prevent them. Therefore, we kindly ask for your cooperation
          in reporting any bugs you encounter. To send feedback, suggest a
          feature,report a bug, use our "Send Feedback" feature. When reporting
          a bug, please include as much detail as possible, such as how'd you
          encountered the bug and your device type. This will greatly help us in
          identifying and resolving the issue as quickly as possible. Thank you
          for your understanding and support in making DOS a better platform for
          everyone.
          <br />
          <br />
          --------------------------------------------------------------------------------------------------------------------------------------------------------------------------
          <br />
          <br />
          We hope you have a fun time here! Thank you for using DOS!
        </p>
      </div>
      <div
        className="delete"
        style={{ position: "absolute", top: "1.5rem", right: "1.5rem" }}
        onClick={onCloseModal}
      ></div>
    </div>
  );
}

export default TermsConditions;
