const contentWrapper = `
  width: 100%;
  background-color: #f9f9f9;
  padding: 40px;
`

const container = `
  max-width: 650px;
  margin: 0 auto;
  background-color: white;
  overflow: hidden;
  text-align: center;
  color: #2b2d42 !important;
  border-radius: 8px;
`

const title = `
text-align:left;
font-size: 20px;
border: 1px solid #dfe4ea;
border-width: 0 0 1px;
padding: 40px 0 16px !important;
margin: 0 40px;
color: #2b2d42 !important;
`

const description = `
  font-size: 18px;
  line-height: 2em;
  padding: 8px 40px;
  color: #2b2d42 !important;
`

const warning = `
font-size: 16px;
line-height: 2em !important;
color: #2b2d42 !important;
`

const button = `
  all: unset;
  font-size: 16px;
  padding: 15px 20px;
  border-radius: 3px;
  background-color: #2b2d42;
  color: white;
  cursor: pointer;
  margin: 0 auto;
  text-decoration: none;
`

const footer = `
font-size: 16px;
background-color: #2b2d42 !important;
color: white;
padding: 16px;
margin-top: 20px;
text-align: center;
`

const contact = `
font-size: 16px;
align-self:start;
padding: 40px 40px 0;
color: #2b2d42 !important;
`

module.exports = {
  contentWrapper,
  container,
  title,
  description,
  warning,
  button,
  footer,
  contact,
}
