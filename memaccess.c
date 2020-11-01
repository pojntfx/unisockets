#include "memaccess.h"
#include <stdio.h>

int main() {
  int my_positive_int = 239234;

  printf("(binary) value=%d pointer=%p size=%lu\n", my_positive_int,
         &my_positive_int, sizeof(my_positive_int));

  transfer_to_runtime(my_positive_int, &my_positive_int,
                      sizeof(my_positive_int));

  int my_negative_int = -239234;

  printf("(binary) value=%d pointer=%p size=%lu\n", my_negative_int,
         &my_negative_int, sizeof(my_negative_int));

  transfer_to_runtime(my_negative_int, &my_negative_int,
                      sizeof(my_negative_int));

  return 0;
}