import { Button, Checkbox, Form, Popover } from 'antd';
import { useRequest } from 'ahooks';
import { useMemo } from 'react';
import { CheckboxChangeEvent } from 'antd/es/checkbox';

const sorterCategories = [
  '娱乐',
  '生活',
  '人文国学',
  '商业财经',
  '热点',
  '历史',
  '个人成长',
  '儿童',
  '外语',
  '音乐',
  '有声书',
  '相声评书',
  '广播剧',
  '有声图书',
  '其他',
];

const Index = () => {
  const [form] = Form.useForm();
  const { data } = useRequest(() =>
    fetch('/ad-mission/dmp/contentTypeTags').then(res => res.json()),
  );
  const categories = useMemo(() => {
    if (data?.data) {
      return sorterCategories.map((item, index) => {
        const list = data.data[item].map((v: any, idx: any) => {
          return {
            title: v,
            index: `${index}/${idx}`,
            label: v,
            value: v,
          };
        });
        return {
          title: item,
          index,
          list,
        };
      });
    }
    return [];
  }, [data?.data]);
  return (
    <div className="container-box">
      <main>
        <Form
          form={form}
          onFinish={v => {
            console.log('🚀 ~ file: page.tsx:9 ~ Index ~ v:', v.category);
          }}
        >
          {/* <Form.Item
            noStyle
            dependencies={['category']}
            // hidden
          >
            <Input type="text" value={form.getFieldValue('category')} />
          </Form.Item> */}
          {categories.map(item => {
            return (
              <Form.Item
                noStyle
                key={item.index}
                name={['category', item.index]}
                // getValueProps={value => {
                //   console.log('🚀 ~ file: page.tsx:67 ~ Index ~ v:', value);
                //   if (value === 'ALL') {
                //     return {
                //       value: {
                //         data: item.list.map((v: any) => v.value),
                //         extra: {
                //           checkedAll: true,
                //         },
                //       },
                //     };
                //   }
                //   return { value };
                // }}
                // getValueFromEvent={v => {
                //   if (v.extra?.checkedAll) {
                //     return 'ALL';
                //   }
                //   return v;
                // }}
                initialValue={{
                  data: [],
                  extra: {
                    checkedAll: false,
                  },
                }}
              >
                <MySelect options={item.list} title={item.title} />
              </Form.Item>
            );
          })}
          {/* <Form.Item
            noStyle
            getValueProps={v => {
              console.log(v);
              return v?.index;
            }}
            getValueFromEvent={v => {
              return {
                index: v - 1,
                value: v,
              };
            }}
          >
            <MySelect />
          </Form.Item> */}
          <Form.Item>
            <Button htmlType="submit" type="primary">
              按钮
            </Button>
          </Form.Item>
          <div
          // onClick={() => {
          //   form.resetFields();
          // }}
          >
            合作形式：节目软植
            <Form.Item noStyle shouldUpdate>
              {() => <SelectTag form={form} />}
            </Form.Item>
          </div>
        </Form>
      </main>
    </div>
  );
};

export default Index;

const MySelect = (props: any) => {
  const indeterminate =
    props.value?.data.length > 0 &&
    props.value?.data.length < props.options?.length;
  const checkedAll = props.options.length === props.value?.data.length;
  const onCheckAllChange = (e: CheckboxChangeEvent) => {
    props.onChange(
      e.target.checked
        ? {
            data: props.options.map((item: any) => item.value),
            extra: {
              checkedAll: true,
            },
          }
        : {
            data: [],
            extra: {
              checkedAll: false,
            },
          },
    );
  };
  const onSingleCheckChange = (e: CheckboxChangeEvent, item: any) => {
    if (e.target.checked) {
      if (!props.value.data.length) {
        props.onChange({
          data: [item.value],
          extra: {
            checkedAll: props.options.length === 1,
          },
        });
      } else {
        const data = [...props.value.data, item.value];
        props.onChange({
          data,
          extra: {
            checkedAll: data.length === props.options.length,
          },
        });
      }
    } else {
      props.onChange({
        data: props.value?.data.filter((v: any) => v !== item.value),
        extra: {
          checkedAll: false,
        },
      });
    }
  };
  const title =
    props.value.data.length === 0
      ? props.title
      : `${props.title}·${props.value.data.length}`;
  return (
    <Popover
      content={
        <>
          <div className="flex flex-col">
            <Checkbox
              indeterminate={indeterminate}
              onChange={onCheckAllChange}
              checked={checkedAll}
            >
              全选
            </Checkbox>
            {props.options.map((item: any) => {
              return (
                <Checkbox
                  checked={
                    props.value?.data.findIndex?.(
                      (v: any) => v === item.value,
                    ) > -1
                  }
                  key={item.index}
                  onChange={e => onSingleCheckChange(e, item)}
                >
                  {item.label}
                </Checkbox>
              );
            })}
          </div>
        </>
      }
    >
      <span className="mr-1 cursor-pointer hover:text-orange-500">{title}</span>
    </Popover>
  );
};

const SelectTag = (props: any) => {
  const catetory = props.form.getFieldsValue().category;
  const existCateory = catetory
    ?.map((item: any) => item.data)
    .filter((item: any) => item.length > 0);
  const fllattenCategory = existCateory?.flat();
  console.log(
    '🚀 ~ file: page.tsx:236 ~ SelectTag ~ fllattenCategory:',
    fllattenCategory,
  );
  return fllattenCategory?.map((item: any) => (
    <span
      key={item}
      className="ml-1 px-3 py-1 bg-gray-500 rounded-full cursor-pointer text-white text-xs"
    >
      {item}
    </span>
  ));
};
