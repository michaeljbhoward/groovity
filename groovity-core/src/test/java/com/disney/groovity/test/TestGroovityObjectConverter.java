/*******************************************************************************
 * Licensed under the Apache License, Version 2.0 (the "Apache License")
 * with the following modification; you may not use this file except in
 * compliance with the Apache License and the following modification to it:
 * Section 6. Trademarks. is deleted and replaced with:
 *
 * 6. Trademarks. This License does not grant permission to use the trade
 *     names, trademarks, service marks, or product names of the Licensor
 *     and its affiliates, except as required to comply with Section 4(c) of
 *     the License and to reproduce the content of the NOTICE file.
 *
 * You may obtain a copy of the Apache License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the Apache License with the above modification is
 * distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the Apache License for the specific
 * language governing permissions and limitations under the Apache License.
 ******************************************************************************/
package com.disney.groovity.test;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.junit.Assert;
import org.junit.Test;

import com.disney.groovity.GroovityObjectConverter;
import com.disney.groovity.model.Model;
import com.disney.groovity.model.ModelConsumer;

public class TestGroovityObjectConverter {

	// --- null handling ---

	@Test
	public void testConvertNullReturnsNull() {
		Assert.assertNull(GroovityObjectConverter.convert(null, String.class));
		Assert.assertNull(GroovityObjectConverter.convert(null, Integer.class));
		Assert.assertNull(GroovityObjectConverter.convert(null, Object.class));
	}

	// --- identity / same-type passthrough ---

	@Test
	public void testConvertToObjectClassReturnsOriginal() {
		String s = "hello";
		Assert.assertSame(s, GroovityObjectConverter.convert(s, Object.class));
		Integer i = 42;
		Assert.assertSame(i, GroovityObjectConverter.convert(i, Object.class));
	}

	@Test
	public void testConvertSameTypeReturnsOriginal() {
		String s = "abc";
		Assert.assertSame(s, GroovityObjectConverter.convert(s, String.class));
	}

	@Test
	public void testConvertAssignableTypeReturnsOriginal() {
		ArrayList<String> list = new ArrayList<>();
		list.add("x");
		Object result = GroovityObjectConverter.convert(list, List.class);
		Assert.assertSame(list, result);
	}

	// --- String conversion ---

	@Test
	public void testConvertToString() {
		Assert.assertEquals("42", GroovityObjectConverter.convert(42, String.class));
		Assert.assertEquals("3.14", GroovityObjectConverter.convert(3.14, String.class));
		Assert.assertEquals("true", GroovityObjectConverter.convert(true, String.class));
	}

	// --- Numeric conversions from strings ---

	@Test
	public void testConvertStringToInteger() {
		Object result = GroovityObjectConverter.convert("123", Integer.class);
		Assert.assertEquals(123, result);
	}

	@Test
	public void testConvertStringToLong() {
		Object result = GroovityObjectConverter.convert("9876543210", Long.class);
		Assert.assertEquals(9876543210L, result);
	}

	@Test
	public void testConvertStringToFloat() {
		Object result = GroovityObjectConverter.convert("2.5", Float.class);
		Assert.assertEquals(2.5f, (Float) result, 0.001f);
	}

	@Test
	public void testConvertStringToDouble() {
		Object result = GroovityObjectConverter.convert("3.14159", Double.class);
		Assert.assertEquals(3.14159, (Double) result, 0.00001);
	}

	@Test
	public void testConvertEmptyStringToNumberReturnsNull() {
		Assert.assertNull(GroovityObjectConverter.convert("", Integer.class));
		Assert.assertNull(GroovityObjectConverter.convert("", Long.class));
	}

	@Test
	public void testConvertNullStringToNumberReturnsNull() {
		Assert.assertNull(GroovityObjectConverter.convert("null", Integer.class));
	}

	@Test(expected = NumberFormatException.class)
	public void testConvertNonNumericStringToIntegerThrows() {
		GroovityObjectConverter.convert("abc", Integer.class);
	}

	// --- Numeric cross-conversions (string-based, avoids Groovy runtime) ---

	@Test
	public void testConvertStringToIntegerFromNumericString() {
		Object result = GroovityObjectConverter.convert("42", Long.class);
		Assert.assertTrue(result instanceof Long);
		Assert.assertEquals(42L, result);
	}

	@Test
	public void testConvertLargeStringToLong() {
		Object result = GroovityObjectConverter.convert("999999999999", Long.class);
		Assert.assertTrue(result instanceof Long);
		Assert.assertEquals(999999999999L, result);
	}

	@Test
	public void testConvertStringToDoubleWithDecimal() {
		Object result = GroovityObjectConverter.convert("1.5", Double.class);
		Assert.assertTrue(result instanceof Double);
		Assert.assertEquals(1.5d, (Double) result, 0.001);
	}

	@Test
	public void testConvertStringToFloatWithDecimal() {
		Object result = GroovityObjectConverter.convert("7.25", Float.class);
		Assert.assertTrue(result instanceof Float);
		Assert.assertEquals(7.25f, (Float) result, 0.001f);
	}

	// --- Primitive type conversions ---

	@Test
	public void testConvertStringToPrimitiveInt() {
		Object result = GroovityObjectConverter.convert("55", Integer.TYPE);
		Assert.assertEquals(55, result);
	}

	@Test
	public void testConvertStringToPrimitiveLong() {
		Object result = GroovityObjectConverter.convert("100", Long.TYPE);
		Assert.assertEquals(100L, result);
	}

	@Test
	public void testConvertStringToPrimitiveFloat() {
		Object result = GroovityObjectConverter.convert("1.5", Float.TYPE);
		Assert.assertEquals(1.5f, (Float) result, 0.001f);
	}

	@Test
	public void testConvertStringToPrimitiveDouble() {
		Object result = GroovityObjectConverter.convert("2.5", Double.TYPE);
		Assert.assertEquals(2.5d, (Double) result, 0.001);
	}

	@Test
	public void testConvertEmptyStringToPrimitiveReturnsNull() {
		Assert.assertNull(GroovityObjectConverter.convert("", Integer.TYPE));
	}

	// --- Boolean conversions ---

	@Test
	public void testConvertStringToBoolean() {
		Assert.assertEquals(true, GroovityObjectConverter.convert("true", Boolean.class));
		Assert.assertEquals(false, GroovityObjectConverter.convert("false", Boolean.class));
		Assert.assertEquals(false, GroovityObjectConverter.convert("anything", Boolean.class));
	}

	@Test
	public void testConvertStringToPrimitiveBoolean() {
		Assert.assertEquals(true, GroovityObjectConverter.convert("true", Boolean.TYPE));
		Assert.assertEquals(false, GroovityObjectConverter.convert("false", Boolean.TYPE));
	}

	@Test
	public void testConvertEmptyStringToBooleanReturnsNull() {
		Assert.assertNull(GroovityObjectConverter.convert("", Boolean.class));
	}

	// --- Date conversions ---

	@Test
	public void testConvertLongToDate() {
		long millis = 1000000000000L;
		Object result = GroovityObjectConverter.convert(millis, Date.class);
		Assert.assertTrue(result instanceof Date);
		Assert.assertEquals(millis, ((Date) result).getTime());
	}

	@Test
	public void testConvertStringToDate() {
		Object result = GroovityObjectConverter.convert("12345", Date.class);
		Assert.assertTrue(result instanceof Date);
		Assert.assertEquals(12345L, ((Date) result).getTime());
	}

	@Test
	public void testConvertEmptyStringToDateReturnsNull() {
		Assert.assertNull(GroovityObjectConverter.convert("", Date.class));
	}

	@Test
	public void testConvertIntToDate() {
		Object result = GroovityObjectConverter.convert(500, Date.class);
		Assert.assertTrue(result instanceof Date);
		Assert.assertEquals(500L, ((Date) result).getTime());
	}

	// --- Enum conversions ---

	enum Color { RED, GREEN, BLUE }

	@Test
	public void testConvertStringToEnum() {
		Object result = GroovityObjectConverter.convert("RED", Color.class);
		Assert.assertEquals(Color.RED, result);
	}

	@Test(expected = IllegalArgumentException.class)
	public void testConvertInvalidStringToEnumThrows() {
		GroovityObjectConverter.convert("PURPLE", Color.class);
	}

	// --- Array conversions ---

	@Test
	public void testConvertSingleValueToArray() {
		Object result = GroovityObjectConverter.convert("hello", String[].class);
		Assert.assertTrue(result instanceof String[]);
		String[] arr = (String[]) result;
		Assert.assertEquals(1, arr.length);
		Assert.assertEquals("hello", arr[0]);
	}

	@Test
	public void testConvertListToArray() {
		List<String> list = Arrays.asList("a", "b", "c");
		Object result = GroovityObjectConverter.convert(list, String[].class);
		Assert.assertTrue(result instanceof String[]);
		String[] arr = (String[]) result;
		Assert.assertArrayEquals(new String[]{"a", "b", "c"}, arr);
	}

	@Test
	public void testConvertArrayToArray() {
		Integer[] input = new Integer[]{1, 2, 3};
		Object result = GroovityObjectConverter.convert(input, String[].class);
		Assert.assertTrue(result instanceof String[]);
		String[] arr = (String[]) result;
		Assert.assertArrayEquals(new String[]{"1", "2", "3"}, arr);
	}

	@Test
	public void testConvertNonConvertibleToArrayWrapsToString() {
		Object input = new Object();
		Object result = GroovityObjectConverter.convert(input, String[].class);
		Assert.assertTrue(result instanceof String[]);
		String[] arr = (String[]) result;
		Assert.assertEquals(1, arr.length);
		Assert.assertEquals(input.toString(), arr[0]);
	}

	// --- List conversions ---

	@Test
	public void testConvertArrayToList() {
		String[] input = new String[]{"x", "y"};
		Object result = GroovityObjectConverter.convert(input, List.class);
		Assert.assertTrue(result instanceof List);
		@SuppressWarnings("unchecked")
		List<Object> list = (List<Object>) result;
		Assert.assertEquals(2, list.size());
		Assert.assertEquals("x", list.get(0));
		Assert.assertEquals("y", list.get(1));
	}

	@Test
	public void testConvertListToArrayWithTypeCoercion() {
		List<String> input = Arrays.asList("10", "20", "30");
		Object result = GroovityObjectConverter.convert(input, Integer[].class);
		Assert.assertTrue(result instanceof Integer[]);
		Assert.assertArrayEquals(new Integer[]{10, 20, 30}, (Integer[]) result);
	}

	// --- List to scalar (extracts first non-null) ---

	@Test
	public void testConvertListToScalarReturnsFirstNonNull() {
		List<Object> input = Arrays.asList(null, "hello", "world");
		Object result = GroovityObjectConverter.convert(input, String.class);
		Assert.assertEquals("hello", result);
	}

	@Test
	public void testConvertSingleElementListToScalar() {
		List<Integer> input = Arrays.asList(42);
		Object result = GroovityObjectConverter.convert(input, String.class);
		Assert.assertEquals("42", result);
	}

	// --- Map conversion ---

	@Test
	public void testConvertMapToMap() {
		Map<String, Integer> input = new LinkedHashMap<>();
		input.put("a", 1);
		input.put("b", 2);
		@SuppressWarnings("unchecked")
		Map<String, Object> result = (Map<String, Object>) GroovityObjectConverter.convert(input, Map.class);
		Assert.assertEquals(2, result.size());
		Assert.assertEquals(1, result.get("a"));
		Assert.assertEquals(2, result.get("b"));
	}

	// --- Model conversion ---

	public static class SimpleModel implements Model {
		String name;
		int age;

		public SimpleModel() {}

		@Override
		public void each(ModelConsumer consumer) {
			consumer.call("name", name);
			consumer.call("age", age);
		}

		@Override
		public boolean put(String key, Object value) {
			if ("name".equals(key)) {
				this.name = value != null ? value.toString() : null;
				return true;
			}
			if ("age".equals(key)) {
				this.age = value != null ? ((Number) value).intValue() : 0;
				return true;
			}
			return false;
		}
	}

	@Test
	public void testConvertModelToMap() {
		SimpleModel input = new SimpleModel();
		input.name = "Bob";
		input.age = 25;
		@SuppressWarnings("unchecked")
		Map<String, Object> result = (Map<String, Object>) GroovityObjectConverter.convert(input, Map.class);
		Assert.assertEquals("Bob", result.get("name"));
		Assert.assertEquals(25, result.get("age"));
	}

	// --- URI conversion via String constructor ---

	@Test
	public void testConvertStringToURI() {
		Object result = GroovityObjectConverter.convert("http://example.com", java.net.URI.class);
		Assert.assertTrue(result instanceof java.net.URI);
		Assert.assertEquals("http://example.com", result.toString());
	}

	@Test
	public void testConvertEmptyStringToURIReturnsNull() {
		Assert.assertNull(GroovityObjectConverter.convert("", java.net.URI.class));
	}

	// --- Edge cases ---

	@Test
	public void testConvertNullStringReturnsNull() {
		Assert.assertNull(GroovityObjectConverter.convert("null", Long.class));
	}

	@Test
	public void testConvertArrayWithSingleElementToScalar() {
		String[] input = new String[]{"value"};
		Object result = GroovityObjectConverter.convert(input, String.class);
		Assert.assertEquals("value", result);
	}

	@Test
	public void testConvertArrayToScalarReturnsFirst() {
		Integer[] input = new Integer[]{10, 20, 30};
		Object result = GroovityObjectConverter.convert(input, String.class);
		Assert.assertEquals("10", result);
	}

	@Test
	public void testConvertArrayWithNullsToScalar() {
		String[] input = new String[]{null, null, "found"};
		Object result = GroovityObjectConverter.convert(input, String.class);
		Assert.assertEquals("found", result);
	}

	@Test
	public void testConvertSameModelTypeReturnsSameInstance() {
		SimpleModel input = new SimpleModel();
		input.name = "Charlie";
		input.age = 40;
		Object result = GroovityObjectConverter.convert(input, SimpleModel.class);
		Assert.assertSame(input, result);
	}

	@Test
	public void testConvertMapToModelPreservesAllFields() {
		Map<String, Object> input = new LinkedHashMap<>();
		input.put("name", "Dave");
		input.put("age", 55);
		Object result = GroovityObjectConverter.convert(input, SimpleModel.class);
		Assert.assertTrue(result instanceof SimpleModel);
		SimpleModel model = (SimpleModel) result;
		Assert.assertEquals("Dave", model.name);
		Assert.assertEquals(55, model.age);
	}

	@Test
	public void testConvertIntegerToString() {
		Assert.assertEquals("100", GroovityObjectConverter.convert(100, String.class));
	}

	@Test
	public void testConvertStringToNegativeInteger() {
		Object result = GroovityObjectConverter.convert("-42", Integer.class);
		Assert.assertEquals(-42, result);
	}

	@Test
	public void testConvertStringToNegativeDouble() {
		Object result = GroovityObjectConverter.convert("-3.14", Double.class);
		Assert.assertEquals(-3.14, (Double) result, 0.001);
	}

	@Test
	public void testConvertZeroStringToNumber() {
		Assert.assertEquals(0, GroovityObjectConverter.convert("0", Integer.class));
		Assert.assertEquals(0L, GroovityObjectConverter.convert("0", Long.class));
		Assert.assertEquals(0.0f, (Float) GroovityObjectConverter.convert("0", Float.class), 0.001f);
	}

	@Test
	public void testConvertListWithMixedTypesToStringArray() {
		List<Object> input = Arrays.asList(1, "two", 3.0, true);
		Object result = GroovityObjectConverter.convert(input, String[].class);
		Assert.assertTrue(result instanceof String[]);
		String[] arr = (String[]) result;
		Assert.assertEquals("1", arr[0]);
		Assert.assertEquals("two", arr[1]);
		Assert.assertEquals("3.0", arr[2]);
		Assert.assertEquals("true", arr[3]);
	}

	@Test
	public void testConvertEmptyListToArray() {
		List<Object> input = new ArrayList<>();
		Object result = GroovityObjectConverter.convert(input, String[].class);
		Assert.assertTrue(result instanceof String[]);
		Assert.assertEquals(0, ((String[]) result).length);
	}

	@Test
	public void testConvertEmptyArrayToList() {
		String[] input = new String[0];
		Object result = GroovityObjectConverter.convert(input, List.class);
		Assert.assertTrue(result instanceof List);
		Assert.assertEquals(0, ((List<?>) result).size());
	}
}
