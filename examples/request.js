import example from '../src/index';
import axios from 'axios';


axios.get('/example_resource', {foo: 'bar', baz: 'biz'}).then(res => {
  console.log(res);
});
