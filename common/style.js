export const mailStyle = `<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai&display=swap');

body {
  background-color: #f1f2f6;
}

.container {
  max-width: 600px;
  font-family: 'Noto Sans Thai', sans-serif;
  width: 80%;
  margin: 0 auto;

  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: white;
  overflow: hidden;
}

.title {
  border: 1px solid #dfe4ea;
  border-width: 0 0 1px;
  padding: 20px 0 8px !important;
  margin: 0 20px;
}

.description {
  line-height: 2em;
  padding: 8px 20px;
}

.description > .warning {
  font-size: 14px;
  line-height: 2em !important;
}

.button {
  all: unset;
  padding: 8px;
  background-color: #04062c;
  color: white;
  cursor: pointer;
}

.button:hover {
  opacity: 0.8;
}

.footer {
  width: 100%;
  background-color: #2b2d42;
  color: white;
  padding: 8px;
  margin-top: 20px;
  text-align: center;
}

.contact {
  align-self:start;
  padding: 20px 20px 0;
}
</style>
`

const test =`${mailStyle}
<div class="container">
<h2 class="title">หนังสือ: XXX ที่คุณได้ทำการขอยืมถูกจัดส่งเรียบร้อยแล้ว เตรียมตัวรับหนังสือได้เลยครับ</h1>
<p class="description">หนังสือ xxx ที่คุณได้ทำการขอยืมได้ถูกจัดส่งเรียบร้อยแล้ว<br />
<span class="warning">**เมื่อได้รับหนังสือแล้ว อย่าลืมกดยืนยันว่าคุณได้รับหนังสือแล้วด้วยนะ เพื่อให้พวกเราทราบว่าคุณได้รับหนังสือแล้ว</span></p>
<a href="http://localhost:3000/profile/bookrequest" class="button">ไปที่เว็บไซต์</a>
<span class="contact">หากมีข้อสงสัยติดต่อเราได้ที่ XXX@gmail.com</span>
<footer class="footer">Share my Book</footer>
</div>`